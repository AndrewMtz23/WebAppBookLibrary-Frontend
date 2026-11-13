import { expect, test, Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const password = 'QaLocalOnly!2026';
test.use({ actionTimeout: 15000 });
async function login(page: Page, role: string) {
  await page.goto('/auth/login'); await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(`${role}@booklibrary.invalid`);
  await page.locator('input[name="password"]').fill(password); await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).not.toHaveURL(/\/auth\//);
}

test('branches preserve separate inventory, shared approval, reader identity and revoked permissions', async ({ page, request, browser }, info) => {
  const marker = await (await request.get('/__qa')).json(); expect(marker.databaseName).toMatch(/^booklibrary_ui_test_/);
  expect((await (await request.get('/api/branches/context')).json()).enabled).toBe(true);
  const auth = async (role:string) => (await request.post('/api/auth/login', { data: { email: `${role}@booklibrary.invalid`, password } })).json();
  const adminAuth = await auth('admin'), librarianAuth = await auth('librarian');
  const admin = { Authorization: `Bearer ${adminAuth.token}` }, staff = { Authorization: `Bearer ${librarianAuth.token}` };
  const initial = (await (await request.get('/api/branches', { headers: admin })).json())[0];
  const suffix = randomUUID().slice(0,8), name = `Norte ${suffix}`, code = `N-${suffix}`.toUpperCase();
  await login(page, 'admin'); await page.goto('/admin/branches');
  await page.getByLabel('Código', {exact:true}).fill(code); await page.getByLabel('Nombre', {exact:true}).fill(name);
  await page.getByRole('button', { name:'Guardar', exact:true }).click();
  await expect(page.getByRole('heading',{name,exact:true})).toBeVisible();
  const branches = await (await request.get('/api/branches/my', {headers:admin})).json(); const north = branches.find((b:any)=>b.code===code);
  expect((await request.get('/api/books',{headers:{...staff,'X-Branch-Id':north.id}})).status()).toBe(403);
  const article=page.locator('article').filter({has:page.getByRole('heading',{name,exact:true})}); await article.getByRole('button',{name:'Bibliotecarios',exact:true}).click();
  await page.getByRole('button',{name:'Asignar',exact:true}).click(); await expect(page.getByRole('button',{name:'Revocar acceso',exact:true})).toBeVisible();
  const headers = {...staff,'X-Branch-Id':initial.id}; const title=`Historias ${suffix}`;
  const created=await request.post('/api/books',{headers,data:{title,authors:['Autora QA'],description:'Historias de prueba para comprobar sucursales y edición compartida.',genres:['Ensayo'],language:'es',mediaType:'physical',totalCopies:0}});
  expect(created.ok(),await created.text()).toBeTruthy();const book=await created.json();
  const staffContext=await browser.newContext();const staffPage=await staffContext.newPage();await login(staffPage,'librarian');
  await staffPage.goto(`/librarian/catalog-membership?branch=${north.id}`);await staffPage.getByLabel('Buscar por título').fill(title);await staffPage.getByRole('button',{name:'Buscar',exact:true}).click();
  await staffPage.locator('article').filter({has:staffPage.getByRole('heading',{name:title,exact:true})}).getByRole('button',{name:'Incluir en el catálogo',exact:true}).click();await staffPage.getByRole('button',{name:'Confirmar',exact:true}).click();
  await expect(staffPage.getByText('Incluido en esta sucursal',{exact:true})).toBeVisible();
  for(const branch of [initial,north]){
    const copy=await request.post(`/api/books/${book.id}/copies`,{headers:{...admin,'X-Branch-Id':branch.id},data:{inventoryCode:`${branch.code}-${suffix}`,condition:'good',location:'QA',notes:null,idempotencyKey:randomUUID()}});expect(copy.ok(),await copy.text()).toBeTruthy();
  }
  await staffPage.goto(`/librarian/books?bookId=${book.id}&branch=${north.id}`);
  await staffPage.getByRole('button',{name:'Editar '+title,exact:true}).click();await staffPage.getByLabel('Título *',{exact:true}).fill(title+' revisado');
  await staffPage.getByRole('button',{name:'Enviar solicitud',exact:true}).click();await expect(staffPage.locator('app-book-editor')).toBeHidden();
  expect((await (await request.get(`/api/books/${book.id}`,{headers})).json()).title).toBe(title);
  await page.goto('/admin/book-changes');const proposal=page.locator('article').filter({has:page.getByRole('heading',{name:title+' revisado',exact:true})});
  await proposal.getByRole('button',{name:'Aprobar cambios',exact:true}).click();await page.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(proposal).toContainText('Aprobada');
  const management = await(await request.get(`/api/books/${book.id}/management`,{headers})).json();
  const rejectedProposal = await request.post(`/api/book-change-requests/books/${book.id}`,{headers,data:{...management.book,title:title+' descartado',expectedMetadataVersion:management.book.metadataVersion}});
  expect(rejectedProposal.ok(),await rejectedProposal.text()).toBeTruthy();
  await page.reload(); const rejection=page.locator('article').filter({has:page.getByRole('heading',{name:title+' descartado',exact:true})});
  await rejection.getByRole('button',{name:'Rechazar',exact:true}).click(); await page.getByRole('button',{name:'Confirmar',exact:true}).click(); await expect(rejection).toContainText('Rechazada');
  expect((await(await request.get(`/api/books/${book.id}`,{headers})).json()).title).toBe(title+' revisado');
  const readerContext=await browser.newContext();const readerPage=await readerContext.newPage();await login(readerPage,'user');
  await readerPage.goto(`/app/catalog/${book.id}?branch=${north.id}`);await expect(readerPage.getByText(title+' revisado',{exact:true}).first()).toBeVisible();
  const user=await auth('user');const userHeaders={Authorization:`Bearer ${user.token}`,'X-Branch-Id':north.id};
  const reservation=await request.post('/api/pickup-reservations',{headers:userHeaders,data:{bookId:book.id,idempotencyKey:randomUUID()}});expect(reservation.status()).toBe(201);
  const pickup = await reservation.json(); expect(pickup.branchId).toBe(north.id);
  expect((await request.put(`/api/branches/${north.id}`,{headers:admin,data:{name,timeZone:north.timeZone,isActive:false,expectedVersion:north.version}})).status()).toBe(409);
  await readerPage.goto('/app/my-library');await expect(readerPage.locator('app-circulation-panel')).toContainText(name);
  const atA=await (await request.get(`/api/books/${book.id}`,{headers})).json();expect(atA.availableCopies).toBe(1);
  const atB=await (await request.get(`/api/books/${book.id}`,{headers:{...headers,'X-Branch-Id':north.id}})).json();expect(atB.availableCopies).toBe(0);
  // An old QR contains only the copy identifier. Its authorized origin must win over the selected branch.
  await staffPage.goto(`/librarian/books?branch=${initial.id}`);
  await staffPage.goto(`/librarian/copies/${pickup.copyId}`);
  await expect(staffPage.getByLabel('Sucursal activa')).toHaveValue(north.id);
  await expect(staffPage.locator('.copy-hero .state')).toHaveText('Retenido');
  const held = await (await request.get(`/api/copies/${pickup.copyId}`,{headers:{...staff,'X-Branch-Id':north.id}})).json();
  await staffPage.getByLabel('Código del ejemplar que tienes delante').fill(held.inventoryCode);
  await staffPage.getByRole('button',{name:'Confirmar entrega',exact:true}).click();
  await expect(staffPage.locator('.copy-hero .state')).toHaveText('Prestado');
  await readerPage.goto(`/app/my-library?branch=${initial.id}`);
  const originLoan = readerPage.locator('.loan-card').filter({hasText:title+' revisado'});
  await expect(originLoan).toContainText(name);
  await expect(originLoan).toContainText(title+' revisado');
  await staffPage.getByLabel('Condición observada').selectOption('good');
  await staffPage.getByLabel('Código del ejemplar que tienes delante').fill(held.inventoryCode);
  await staffPage.getByRole('button',{name:'Confirmar devolución',exact:true}).click();
  await expect(staffPage.locator('.copy-hero .state')).toHaveText('Disponible');

  expect((await request.post(`/api/favorites/${book.id}`,{headers:userHeaders})).ok()).toBeTruthy();
  const savedReading = await request.put(`/api/reading/my/books/${book.id}`,{headers:userHeaders,data:{status:'reading',progressMode:'percent',progressPercent:37,currentPage:null,expectedRevision:null}});
  expect(savedReading.ok(),await savedReading.text()).toBeTruthy(); const reading = await savedReading.json();
  expect((await request.post('/api/auth/email-verification/request',{headers:userHeaders})).status()).toBe(202);
  let verifyToken='';await expect.poll(async()=>{const mail=await(await request.get('/__qa/mail')).json();verifyToken=mail.find((m:any)=>m.email==='user@booklibrary.invalid'&&m.purpose==='verify')?.token??'';return verifyToken.length;},{timeout:15000}).toBe(43);
  expect((await request.post('/api/auth/email-verification/confirm',{data:{token:verifyToken}})).status()).toBe(204);
  expect((await request.put(`/api/books/${book.id}/reviews/my`,{headers:userHeaders,data:{rating:5,text:'Una misma lectura entre sucursales',expectedVersion:0}})).ok()).toBeTruthy();
  const ownReview=await(await request.get(`/api/books/${book.id}/reviews/my`,{headers:userHeaders})).json();
  for(const branch of [initial,north]){
    const selected={...userHeaders,'X-Branch-Id':branch.id};
    const progress=await(await request.get('/api/reading/my',{headers:selected})).json();
    expect(progress.items.find((r:any)=>r.bookId===book.id).revision).toBe(reading.revision);
    expect((await(await request.get(`/api/books/${book.id}/reviews/my`,{headers:selected})).json()).id).toBe(ownReview.id);
    expect((await(await request.get('/api/favorites',{headers:selected})).json()).items.filter((b:any)=>b.bookId===book.id)).toHaveLength(1);
  }
  await readerPage.goto(`/app/catalog/${book.id}?branch=${north.id}`);
  await readerPage.getByLabel('Sucursal activa').selectOption(initial.id);
  await expect(readerPage).toHaveURL(new RegExp(`branch=${initial.id}`));
  await readerPage.reload(); await expect(readerPage.getByLabel('Sucursal activa')).toHaveValue(initial.id);
  for(const theme of ['light','dark'])for(const width of [360,768,1366,1920]){
    await staffPage.goto(`/librarian/catalog-membership?branch=${north.id}`);await staffPage.setViewportSize({width,height:900});await staffPage.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
    await expect(staffPage.getByRole('heading',{name:'Incluir títulos existentes',exact:true})).toBeVisible();
    await staffPage.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    expect(await staffPage.evaluate(async () => (await (window as any).axe.run(document.querySelector('main'))).violations)).toEqual([]);
    await staffPage.screenshot({path:info.outputPath(`branches-${theme}-${width}.png`),fullPage:true});
  }
  for(const route of ['branches','book-changes'])for(const theme of ['light','dark'])for(const width of [360,768,1366,1920]){
    await page.goto(`/admin/${route}`);await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
    await expect(page.locator('main h1')).toBeVisible();
    if(route==='book-changes') await page.getByText('Comparar propuesta',{exact:true}).first().click();
    await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
    expect(await page.evaluate(async()=>(await(window as any).axe.run(document.querySelector('main'))).violations)).toEqual([]);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
    await page.screenshot({path:info.outputPath(`${route}-${theme}-${width}.png`),fullPage:true});
  }
  await page.goto('/admin/branches');await article.getByRole('button',{name:'Bibliotecarios',exact:true}).click();await page.getByRole('button',{name:'Revocar acceso',exact:true}).click();
  expect((await request.get('/api/books',{headers:{...staff,'X-Branch-Id':north.id}})).status()).toBe(403);
  expect((await request.put(`/api/branches/${north.id}`,{headers:admin,data:{name,timeZone:north.timeZone,isActive:false,expectedVersion:north.version}})).ok()).toBeTruthy();
  expect((await request.get('/api/books',{headers:{...userHeaders,'X-Branch-Id':north.id}})).status()).toBe(404);
  await staffContext.close();await readerContext.close();
});
