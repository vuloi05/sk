import translate from 'google-translate-api-x';

async function test() {
  const res = await translate('address', { from: 'en', to: 'vi' });
  console.log('address =>', res.text);
}
test();
