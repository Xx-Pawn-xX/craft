const btn = document.getElementById('ping');
const out = document.getElementById('out');
let n = 0;
btn.addEventListener('click', () => {
  n++;
  out.textContent = `Clicked ${n} time${n === 1 ? '' : 's'} ✨`;
  console.log('click', n);
});
console.log('Welcome to XCODX! Edit code on the left and watch it run instantly.');