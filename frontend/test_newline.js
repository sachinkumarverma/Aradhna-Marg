const html = `<h2>दीपावली का पावन पर्व</h2>

<p>दीपावली, जिसे दीपोत्सव...</p>

<h3>दीपावली क्यों मनाई जाती है?</h3>

<p>दीपावली से जुड़ी सबसे...</p>

<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>`;

const replaced = html.replace(/(?:\r?\n){2,}/g, '\n<p><br></p>\n');
console.log(replaced);
