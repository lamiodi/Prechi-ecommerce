const key = 'dc598dd74301e19aeef7ccc8';
async function test() {
  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${key}/latest/NGN`);
    const data = await res.json();
    console.log('Result status:', data.result);
    console.log('1 NGN in USD:', data.conversion_rates?.USD);
    console.log('₦85,000 in USD: $', (85000 * data.conversion_rates?.USD).toFixed(2));
    console.log('1 USD in NGN: ₦', (1 / data.conversion_rates?.USD).toFixed(2));
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
