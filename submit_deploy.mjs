import { execSync } from 'child_process';

const code = `(() => {
  const form = document.querySelector('form');
  if (form) {
    const btn = Array.from(form.querySelectorAll('button')).find(b => b.textContent.includes('Save and Deploy'));
    if (btn) {
      btn.click();
      return 'clicked Save and Deploy';
    }
    form.requestSubmit();
    return 'form requestSubmit called';
  }
  return 'form not found';
})()`.replace(/\s+/g, ' ');

const out = execSync(`orca eval --expression ${JSON.stringify(code)} --json`, { encoding: 'utf-8' });
console.log('Result:', out);
