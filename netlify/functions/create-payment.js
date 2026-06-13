const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
  try {
    const { orderId, total, email, name, items } = JSON.parse(event.body);
    console.log('Stripe body:', orderId, total, email);
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: { name: item.label, description: (item.qty + ' — ' + item.handle).substring(0, 200) },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: 1,
    }));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: email,
      metadata: { orderId, name },
      success_url: `https://prestige-social.netlify.app/?success=true&order=${orderId}`,
      cancel_url: `https://prestige-social.netlify.app/?cancelled=true`,
    });
    console.log('Stripe session created:', session.id);
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.log('Stripe ERROR:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
