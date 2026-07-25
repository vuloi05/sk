async function test() {
  const text = 'I walked across the street';
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=' + encodeURIComponent(text);
  const res = await fetch(url);
  const data = await res.json();
  console.log(data[0][0][0]);
}
test();
