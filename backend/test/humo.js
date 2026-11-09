const { crearContexto } = require('./mock');
const ctx = crearContexto();
const run = s => require('vm').runInContext(s, ctx);
console.log(JSON.stringify(run('prepararSistema()')).substring(0,200));
console.log(run("crearPrimerAdministrador('a@x.com','Admin','1234')"));
const r = run("despachar({accion:'login',email:'a@x.com',pin:'1234'})");
console.log(r.roles, r.token.length);
