exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_TABLE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;

  console.log('BASE_ID:', baseId);
  console.log('TABLE_ID:', tableId);
  console.log('API_KEY exists:', !!apiKey);

  try {
    const url = `https://api.airtable.com/v0/${baseId}/${tableId}?sort[0][field]=Date&sort[0][direction]=desc`;
    console.log('Calling URL:', url);

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    const text = await res.text();
    console.log('AIRTABLE RESPONSE:', text);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: text
    };
  } catch(err) {
    console.log('ERROR:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
