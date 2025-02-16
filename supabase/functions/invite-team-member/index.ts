
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    const { email, role } = await req.json()

    // Get the origin from the request headers
    const origin = req.headers.get('origin') || 'http://localhost:3000'

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      // Add user to team_members if not already a member
      const { error: teamMemberError } = await supabase
        .from('team_members')
        .insert({
          user_id: existingUser.id,
          role: role,
        })
        .select()
        .single()

      if (teamMemberError?.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'User is already a team member' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    } else {
      // Check for existing pending invitation
      const { data: existingInvitation } = await supabase
        .from('team_invitations')
        .select('id, token')
        .eq('email', email)
        .eq('status', 'pending')
        .single()

      let invitationToken: string

      if (existingInvitation) {
        // Update the existing invitation's expiry and created_at
        const { error: updateError } = await supabase
          .from('team_invitations')
          .update({
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString()
          })
          .eq('id', existingInvitation.id)

        if (updateError) throw updateError
        invitationToken = existingInvitation.token
      } else {
        // Create new invitation record
        const { data: newInvitation, error: inviteError } = await supabase
          .from('team_invitations')
          .insert({
            email,
            role,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select('token')
          .single()

        if (inviteError) throw inviteError
        invitationToken = newInvitation.token
      }

      // Send invitation email with token in URL and using the correct origin
      const emailResponse = await resend.emails.send({
        from: "noreply@app.capitalninja.ai",
        to: [email],
        subject: "You've been invited to join Capital Ninja",
        html: `
<!DOCTYPE html>
<html>
<body>
  <h1>You've been invited to join Capital Ninja</h1>
  <p>Hello,</p>
  <p>You have been invited to join Capital Ninja as a ${role}.</p>
  <p>Click the link below to join:</p>
  <p><a href="${origin}/auth?invitation=${invitationToken}">Accept Invitation</a></p>
  <p>If you did not expect this invitation, you can safely ignore this email.</p>
  <p>Best regards,<br>The Capital Ninja Team</p>
</body>
</html>
        `,
      })

      console.log('Invitation email sent:', emailResponse)
    }

    return new Response(
      JSON.stringify({ message: 'Invitation sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in invite-team-member function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
