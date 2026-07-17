const PAYPAL_CLIENT_ID = 'AanTxBfk-bUZ84SRf8LH4uALqvtidY-UzjMrz81Xkmj0KUuq4QvEx0zsI_pTSTtWW7-tgo3qPlJaJbud';
const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET_KEY}`).toString('base64');
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Token PayPal échoué : ' + JSON.stringify(data));
  return data.access_token;
}

async function sendConfirmationEmail(name, email, orderId, total) {
  const totalFormatted = parseFloat(total).toFixed(2).replace('.', ',');

  const htmlContent = `
  <!DOCTYPE html>
  <html lang="fr">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="margin:0;padding:0;background:#060606;font-family:'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#060606;padding:40px 20px;">
      <tr><td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border:1px solid rgba(201,168,76,0.2);">

          <!-- Header doré -->
          <tr>
            <td style="background:linear-gradient(135deg,#9A7A2E,#C9A84C);padding:2px 0;"></td>
          </tr>

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:44px 40px 32px;">
              <div style="font-family:Georgia,serif;font-size:1.5rem;letter-spacing:0.35em;color:#C9A84C;">
                PRESTIGE <span style="font-style:italic;color:#F5F0E8;">Social</span>
              </div>
            </td>
          </tr>

          <!-- Icône -->
          <tr>
            <td align="center" style="padding:0 40px 24px;">
              <div style="font-size:2.4rem;">✨</div>
            </td>
          </tr>

          <!-- Titre -->
          <tr>
            <td align="center" style="padding:0 40px 12px;">
              <h1 style="font-family:Georgia,serif;font-size:1.8rem;font-weight:300;color:#F5F0E8;margin:0;letter-spacing:0.02em;">
                Commande confirmée
              </h1>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:20px 44px 32px;">
              <p style="font-size:0.82rem;color:rgba(245,240,232,0.6);line-height:1.9;margin:0;letter-spacing:0.04em;">
                Bonjour <strong style="color:#F5F0E8;">${name}</strong>,<br><br>
                Nous avons bien reçu votre commande et votre paiement a été validé avec succès. Notre équipe prend en charge votre demande dans les meilleurs délais.
              </p>
            </td>
          </tr>

          <!-- Récap commande -->
          <tr>
            <td style="padding:0 44px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0C0C0C;border:1px solid rgba(201,168,76,0.12);">
                <tr>
                  <td style="padding:10px 20px;border-bottom:1px solid rgba(201,168,76,0.08);">
                    <span style="font-size:0.58rem;letter-spacing:0.25em;text-transform:uppercase;color:rgba(201,168,76,0.6);">Récapitulatif</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 20px 10px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:0.72rem;color:rgba(245,240,232,0.5);letter-spacing:0.08em;">N° de commande</td>
                        <td align="right" style="font-size:0.72rem;color:#C9A84C;font-weight:500;letter-spacing:0.08em;">${orderId}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 20px 18px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:0.72rem;color:rgba(245,240,232,0.5);letter-spacing:0.08em;">Montant réglé</td>
                        <td align="right" style="font-family:Georgia,serif;font-size:1.5rem;font-weight:300;color:#E8C97A;">€${totalFormatted}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message final -->
          <tr>
            <td style="padding:0 44px 40px;">
              <p style="font-size:0.76rem;color:rgba(245,240,232,0.45);line-height:1.9;margin:0;letter-spacing:0.04em;text-align:center;">
                Vous n'avez rien d'autre à faire.<br>
                Merci pour votre confiance.
              </p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td align="center" style="padding:0 44px 44px;">
              <div style="font-family:Georgia,serif;font-size:0.9rem;font-style:italic;color:rgba(201,168,76,0.7);letter-spacing:0.1em;">
                L'équipe Prestige Social
              </div>
            </td>
          </tr>

          <!-- Footer ligne dorée -->
          <tr>
            <td style="background:linear-gradient(135deg,#9A7A2E,#C9A84C);padding:1px 0;"></td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: { name: 'Prestige Social', email: 'prestigesocial@outlook.com' },
      to: [{ email, name }],
      subject: `Votre commande Prestige Social est confirmée ✨ — ${orderId}`,
      htmlContent
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.log('BREVO ERROR:', err);
  }
  return res.ok;
}

async function saveToAirtable(orderId, date, name, email, total, items, method) {
  const articlesText = items.map(i => `${i.icon} ${i.label} — ${i.qty} — ${i.handle}`).join('\n');
  const res = await fetch(`https://api.airtable.com/v0/appIaNd2nnVeMrVPV/tbl4NTNNq1fs5iZdh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
    },
    body: JSON.stringify({
      fields: {
        'ID Commande': orderId,
        'Date': date,
        'Prénom': name,
        'Email': email,
        'Total': parseFloat(total),
        'Articles': articlesText,
        'Statut': 'En attente',
        'Méthode paiement': 'PayPal'
      }
    })
  });
  if (!res.ok) {
    const err = await res.text();
    console.log('AIRTABLE ERROR:', err);
  }
  return res.ok;
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { paypalOrderId, orderId, total, email, name, items } = JSON.parse(event.body);
    console.log('Capture request:', { paypalOrderId, orderId, total, email, name });

    // 1. Capturer le paiement PayPal
    const accessToken = await getAccessToken();
    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const capture = await captureRes.json();
    console.log('CAPTURE RESPONSE:', JSON.stringify(capture));

    if (capture.status !== 'COMPLETED') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Paiement non complété', details: capture }) };
    }

    const date = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

    // 2. Sauvegarder dans Airtable
    await saveToAirtable(orderId, date, name, email, total, items || [], 'PayPal');

    // 3. Envoyer le mail de confirmation
    await sendConfirmationEmail(name, email, orderId, total);

    return { statusCode: 200, body: JSON.stringify({ success: true, orderId }) };

  } catch (err) {
    console.log('ERROR:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
