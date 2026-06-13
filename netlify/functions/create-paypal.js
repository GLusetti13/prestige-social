const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const PAYPAL_CLIENT_ID = 'AanTxBfk-bUZ84SRf8LH4uALqvtidY-UzjMrz81Xkmj0KUuq4QvEx0zsI_pTSTtWW7-tgo3qPlJaJbud';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET_KEY;
const PAYPAL_API = 'https://api-m.paypal.com'; // live

async function getAccessToken() {
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  return data.access_token;
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { orderId, total, items } = JSON.parse(event.body);
    const accessToken = await getAccessToken();

    const order = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          description: items.map(i => i.label).join(', ').substring(0, 127),
          amount: {
            currency_code: 'EUR',
            value: total.toFixed(2),
            breakdown: {
              item_total: { currency_code: 'EUR', value: total.toFixed(2) }
            }
          },
          items: items.map(i => ({
            name: i.label.substring(0, 127),
            description: (i.qty + ' — ' + i.handle).substring(0, 127),
            unit_amount: { currency_code: 'EUR', value: i.price.toFixed(2) },
            quantity: '1'
          }))
        }],
        application_context: {
          brand_name: 'Prestige Social',
          locale: 'fr-FR',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          return_url: `https://prestige-social.netlify.app/?paypal_success=true&order=${orderId}`,
          cancel_url: `https://prestige-social.netlify.app/?paypal_cancelled=true`
        }
      })
    });

    const orderData = await order.json();
    const approveLink = orderData.links?.find(l => l.rel === 'approve')?.href;

    if (!approveLink) {
      return { statusCode: 500, body: JSON.stringify({ error: 'No approve link', details: orderData }) };
    }

    return { statusCode: 200, body: JSON.stringify({ url: approveLink }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
