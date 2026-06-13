const PAYPAL_CLIENT_ID = 'AcLThrRvV8jviz-oARQgPOYnAm6ZkJ8cQ4Hz9q2TPZ7hnww3tzAfHHixgHDzKhxwndntm7W0FFEG9DRx';
const PAYPAL_API = 'https://api-m.paypal.com';

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
  console.log('TOKEN RESPONSE:', JSON.stringify(data));
  if (!data.access_token) throw new Error('Token failed: ' + JSON.stringify(data));
  return data.access_token;
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  console.log('PAYPAL_SECRET_KEY exists:', !!process.env.PAYPAL_SECRET_KEY);
  try {
    const body = JSON.parse(event.body);
    console.log('Body received:', JSON.stringify(body));
    const { orderId, total, items } = body;
    const accessToken = await getAccessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          amount: { currency_code: 'EUR', value: total.toFixed(2) }
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
    const order = await res.json();
    console.log('ORDER RESPONSE:', JSON.stringify(order));
    const approveLink = order.links?.find(l => l.rel === 'approve')?.href;
    if (!approveLink) return { statusCode: 500, body: JSON.stringify({ error: 'No approve link', details: order }) };
    return { statusCode: 200, body: JSON.stringify({ url: approveLink }) };
  } catch (err) {
    console.log('ERROR:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
