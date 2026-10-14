import fs from 'fs';

async function sendCdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('Connecting to Chrome DevTools on port 9222...');
  const versionRes = await fetch('http://localhost:9222/json/version');
  const versionData = await versionRes.json();
  const browserWs = new WebSocket(versionData.webSocketDebuggerUrl);
  await new Promise((res) => (browserWs.onopen = res));

  // Create new page target
  const { targetId } = await sendCdp(browserWs, 'Target.createTarget', {
    url: 'about:blank',
  });
  console.log('Created target:', targetId);

  const targets = await fetch('http://localhost:9222/json');
  const targetList = await targets.json();
  const pageTarget = targetList.find((t) => t.id === targetId);

  const pageWs = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((res) => (pageWs.onopen = res));

  await sendCdp(pageWs, 'Page.enable');
  await sendCdp(pageWs, 'Runtime.enable');
  await sendCdp(pageWs, 'DOM.enable');
  await sendCdp(pageWs, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // 1. Navigate to Public Registration Page for Event 2
  console.log(
    'Navigating to Public Registration Page for Event 2 (http://localhost:4200/events/2/register)...',
  );
  await sendCdp(pageWs, 'Page.navigate', {
    url: 'http://localhost:4200/events/2/register',
  });
  await sleep(4000);

  // Capture screenshot of the Public Registration Page with all custom form elements
  const shot1 = await sendCdp(pageWs, 'Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  });
  fs.writeFileSync(
    './public_registration_form.png',
    Buffer.from(shot1.data, 'base64'),
  );
  console.log(
    'Screenshot 1 saved: ./public_registration_form.png (' +
      shot1.data.length +
      ' bytes)',
  );

  // Inspect form fields rendered on the page
  const inspectFields = await sendCdp(pageWs, 'Runtime.evaluate', {
    expression: `
      Array.from(document.querySelectorAll('.form-group')).map(g => {
        const label = g.querySelector('.form-label')?.innerText?.trim();
        const input = g.querySelector('input, select, textarea');
        const type = input?.type || input?.tagName?.toLowerCase();
        return { label, type };
      }).filter(f => f.label);
    `,
    returnByValue: true,
  });
  console.log(
    'Rendered fields on Public Registration Form:',
    inspectFields.result?.value,
  );

  // 2. Log in as superadmin on http://localhost:4200/login
  console.log('Navigating to login page...');
  await sendCdp(pageWs, 'Page.navigate', {
    url: 'http://localhost:4200/login',
  });
  await sleep(2500);

  // Fill login credentials
  await sendCdp(pageWs, 'Runtime.evaluate', {
    expression: `
      const emailInput = document.querySelector('input[type="email"], input[name="email"], input[formcontrolname="email"]');
      const passInput = document.querySelector('input[type="password"], input[name="password"], input[formcontrolname="password"]');
      if (emailInput) {
        emailInput.value = 'test@test.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (passInput) {
        passInput.value = 'test';
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    `,
  });
  await sleep(3000);

  // 3. Navigate to Event Roster (http://localhost:4200/events/2/roster)
  console.log(
    'Navigating to Event Roster (http://localhost:4200/events/2/roster)...',
  );
  await sendCdp(pageWs, 'Page.navigate', {
    url: 'http://localhost:4200/events/2/roster',
  });
  await sleep(4000);

  // Check the table headers rendered in the roster
  const tableHeaders = await sendCdp(pageWs, 'Runtime.evaluate', {
    expression: `
      Array.from(document.querySelectorAll('.roster-table th')).map(th => th.innerText.trim());
    `,
    returnByValue: true,
  });
  console.log('Event Roster Table Headers:', tableHeaders.result?.value);

  // Check the athlete rows rendered in the roster
  const athleteRows = await sendCdp(pageWs, 'Runtime.evaluate', {
    expression: `
      Array.from(document.querySelectorAll('.roster-table tbody tr')).map(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim().replace(/\\n+/g, ' | '));
        return cells;
      });
    `,
    returnByValue: true,
  });
  console.log(
    'Event Roster Rows (Fighters & Custom Field Values):',
    athleteRows.result?.value,
  );

  // Capture screenshot of Event Roster Table
  const shot2 = await sendCdp(pageWs, 'Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  });
  fs.writeFileSync(
    './event_roster_table.png',
    Buffer.from(shot2.data, 'base64'),
  );
  console.log(
    'Screenshot 2 saved: ./event_roster_table.png (' +
      shot2.data.length +
      ' bytes)',
  );

  // 4. Click the "View Details" button for the first athlete (Priya Sharma)
  console.log('Clicking View Details icon for first athlete...');
  await sendCdp(pageWs, 'Runtime.evaluate', {
    expression: `
      const viewBtn = document.querySelector('.btn-action-icon.view');
      if (viewBtn) viewBtn.click();
    `,
  });
  await sleep(2500);

  // Capture screenshot of Athlete Details Modal
  const shot3 = await sendCdp(pageWs, 'Page.captureScreenshot', {
    format: 'png',
  });
  fs.writeFileSync(
    './athlete_details_modal.png',
    Buffer.from(shot3.data, 'base64'),
  );
  console.log(
    'Screenshot 3 saved: ./athlete_details_modal.png (' +
      shot3.data.length +
      ' bytes)',
  );

  // Inspect values in the Athlete Details modal
  const modalInspection = await sendCdp(pageWs, 'Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('.details-dialog');
      if (!modal) return { found: false };
      const title = modal.querySelector('.modal-title')?.innerText?.trim();
      const athleteName = modal.querySelector('.athlete-summary h3')?.innerText?.trim();
      const meta = Array.from(modal.querySelectorAll('.details-meta-bar .meta-item')).map(m => m.innerText.trim());
      const summaryRows = Array.from(modal.querySelectorAll('.responses-table tbody tr')).map(tr => {
        const tds = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        return { field: tds[0], value: tds[1] };
      });
      return { found: true, title, athleteName, meta, summaryRows };
    })()`,
    returnByValue: true,
  });
  console.log(
    'Athlete Details Modal Inspection:',
    JSON.stringify(modalInspection.result?.value, null, 2),
  );

  pageWs.close();
  browserWs.close();
  console.log('Browser test execution completed successfully!');
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
