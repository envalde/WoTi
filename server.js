const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const path = require("path");

const database = require('./database');

const app = express();

app.use(express.static("public/"));
app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());






//Arbeitszeiterfassung

//Arbeitszeit Startseite
app.get("/", async (req, res) => {
  //MYSQL Anfrage um die Firmennamen und die FirmenID's zu bekommen
  var sqlfirma = 'SELECT k.*, r.beschreibung FROM kunde k , rechnungformat r WHERE r.id = k.rechnung ORDER BY k.firmenname';
  var sqlprojekt = 'SELECT p.*, k.firmenname FROM projekt p, kunde k WHERE p.kunden_id = k.id ORDER BY p.projektname';
  var sqlmitarbeiter = 'SELECT * FROM mitarbeiter ORDER BY nachname, vorname';
  
  var result = await database.queryDB(sqlfirma);
  var projekt = await database.queryDB(sqlprojekt);
  var mitarbeiter = await database.queryDB(sqlmitarbeiter);
  
  res.render("index", {
    style: "index",
    titel: "Startseite",
    firmennamen: result,
    projektnamen: projekt,
    mitarbeiter: mitarbeiter
  });
});

//Erfassung der Arbeitszeiten & Weiterleitung auf Arbeitszeit Startseite
app.post('/', async (req, res) =>{
  var sql = 'INSERT INTO arbeitszeit (projekt_id, mitarbeiter_id, datum, arbeitsbeginn, arbeitsende, pause, geleistete_Stunden, fahrtkosten, was_wurde_erledigt) Values (?,?,?,?,?,?,?,?,?)';
  var variables = [req.body.projekt, req.body.mitarbeiter, req.body.datum, req.body.abUNIX, req.body.aeUNIX, req.body.pause, req.body.arbeitszeit, req.body.fahrtkosten, req.body.erledigt];
  var arbeitszeit = await database.queryDB(sql, variables);
  //Abspeichern der Daten in der Datenbank
  res.redirect('/');
});


//AJAX Call um Projekte zu bekommen.
app.post('/get_projekte/:id', async( req, res) =>{
  var sql = 'SELECT id, projektname FROM projekt WHERE kunden_id = ?';
  var variables = [req.params.id];
  var projekte = await database.queryDB(sql, variables);
  res.send(projekte);
});

//Arbeitszeiten Übersicht
app.get('/arbeitszeiten', async (req, res) =>{
  var sql = 'SELECT a.id, k.firmenname, p.projektname, m.vorname, m.nachname, a.geleistete_Stunden,a.was_wurde_erledigt AS erledigt, a.geleistete_Stunden *k.stundensatz AS kosten FROM arbeitszeit a, kunde k , projekt p, mitarbeiter m WHERE a.projekt_id =p.id AND m.id =a.mitarbeiter_id AND p.kunden_id = k.id';
  var arbeitszeiten = await  database.queryDB(sql);
  res.render('arbeitszeiten/arbeitszeiten', {
    style: "index",
    titel: "Arbeitszeiten Übersicht",
    data: arbeitszeiten
  })
});



//Rechnungserstellung

app.get('/rechnung/:id', async (req, res) =>{
  
  
  var sql = 'SELECT k.rechnung FROM kunde k, arbeitszeit a, projekt p WHERE a.projekt_id = p.id AND p.kunden_id = k.id AND a.id = ?';
  var variables = [req.params.id];
  var rechnung = await database.queryDB(sql, variables);
  console.log(rechnung);
  console.log(rechnung[0].rechnung);
  //rechnung = 1 == nach jedem auftrag
  //rechnung =2 == alle 3 Monate
  
  //if else für templates für nach jedem auftrag & für 3 monats Intervall
  
  
  res.render('rechnung/singleRechnung', {
    style: 'index',
    titel: 'Rechnung'
  })
});






//Kunde

//Kunden Startseite
app.get('/kunden', async (req, res) => {
  var sql = 'SELECT k.*, r.beschreibung FROM kunde k , rechnungformat r WHERE r.id = k.rechnung ORDER BY k.firmenname';
  var kunden = await database.queryDB(sql);
  res.render('kunde/kunden', {
    style: 'index',
    titel:"Kundenportal",
    data: kunden
  });
});

//Kunde anlegen Seite aufrufen
app.get('/kunde_anlegen', (req, res) => {
  res.render('kunde/kundeAnlegen',{
    style: 'index',
    titel: "Kunde anlegen"
  });
});

//Kunde anlegen & Weiterleitung auf kunden Startseite
app.post('/kunde_anlegen', async (req, res) =>{
  var sql = 'INSERT INTO kunde (firmenname, stundensatz, rechnung) VALUES (?,?,?)';
  var variables = [req.body.kundenname, req.body.stundensatz, req.body.rechnung];
  var kunde = await database.queryDB(sql, variables);
  res.redirect('/kunden'); 
});

//Kunde aktualisieren Seite
app.get('/update_kunde/:id', async (req, res) =>{
  var sql = 'SELECT * FROM kunde WHERE id = ?';
  var variables = [req.params.id];
  var kunde = await database.queryDB(sql, variables);
  res.render('kunde/updateKunde',{
    style: "index",
    titel: 'Kundendaten aktualisieren',
    data: kunde
  });
});

//Kunde aktualieren & Weiterleitung auf Kunden Startseite
app.post('/update_kunde/:id' , async (req, res) =>{
  var sql = 'UPDATE kunde SET firmenname = ?, stundensatz = ?, rechnung = ? WHERE id = ?';
  var variables = [req.body.kundenname, req.body.stundensatz, req.body.rechnung, req.params.id];
  var update = await database.queryDB(sql, variables);
  res.redirect('/kunden'); 
});











//Projekt

//Projekt Startseite
app.get('/projekte', async (req, res,) => {
  var sql = 'SELECT p.id, p.projektname, k.firmenname, SUM(a.geleistete_Stunden) AS stunden, SUM(a.geleistete_Stunden) * k.stundensatz AS kosten FROM projekt p, kunde k, arbeitszeit a WHERE p.kunden_id = k.id AND a.projekt_id = p.id GROUP BY p.id, p.projektname, k.firmenname UNION SELECT p.id, p.projektname, k.firmenname, 0 AS stunden, 0 AS kosten FROM projekt p, kunde k WHERE p.kunden_id = k.id AND p.id NOT IN (SELECT DISTINCT projekt_id FROM arbeitszeit)';
  var projekte = await database.queryDB(sql);
  res.render('projekt/projekte', {
    style: 'index',
    titel:"Projektportal",
    data: projekte
  });
});


//Projekt anlegen Seite
app.get('/projekt_anlegen', async (req, res) =>{
  var sql = 'SELECT k.*, r.beschreibung FROM kunde k , rechnungformat r WHERE r.id = k.rechnung ORDER BY k.firmenname';
  var firmennamen = await database.queryDB(sql);
  res.render("projekt/projektAnlegen", {
    style: "index",
    titel: "Projekt anlegen",
    data: firmennamen
  });
});


//Projekt anlegen & Weiterleitung auf Projekt Startseite
app.post('/projekt_anlegen', async (req, res) =>{
  var sql = 'INSERT INTO projekt (kunden_id, projektname) VALUES (?,?)';
  var variables = [req.body.kunde, req.body.projektname];
  var projekt = await database.queryDB(sql, variables);
  res.redirect('/projekte');
});

//Projekt aktualiseren Seite laden
app.get('/update_projekt/:id', async (req, res) =>{
  var sql = 'SELECT p.*, k.firmenname FROM projekt p, kunde k  WHERE p.id = ? AND k.id = p.kunden_id';
  var variables = [req.params.id];
  var projekt = await database.queryDB(sql, variables);
  res.render('projekt/updateProjekt',{
    style: 'index',
    titel: 'Projekt aktualisieren',
    data: projekt
  })
});

app.post('/update_projekt/:id', async (req, res) =>{
  var sql = 'UPDATE projekt SET projektname = ? WHERE id=?';
  var variables = [req.body.projektname, req.params.id];
  var projekt = await database.queryDB(sql, variables);
  res.redirect('/projekte');
});
  








//Mitarbeiter

//Mitarbeiter Übersichts Seite
app.get('/mitarbeiter', async (req, res) =>{
  //mitarbeiter aus Datenbank lesen
  var sql = 'SELECT m.id, m.vorname, m.nachname, SUM(geleistete_Stunden) AS stunden FROM mitarbeiter m , arbeitszeit a WHERE m.id = a.mitarbeiter_id GROUP BY m.id, m.vorname, m.nachname UNION SELECT id, vorname, nachname, 0 AS stunden FROM mitarbeiter WHERE id NOT IN (SELECT DISTINCT mitarbeiter_id FROM arbeitszeit) ORDER BY nachname, vorname';
  var mitarbeiter = await database.queryDB(sql);
  res.render('mitarbeiter/mitarbeiter' , {
    style: 'index',
    titel: 'Mitarbeiterprotal',
    data: mitarbeiter
  });
});

//Mitarbeiter anlegen Seite
app.get('/mitarbeiter_anlegen', (req, res) =>{
  res.render('mitarbeiter/mitarbeiterAnlegen',{
    style: 'index',
    titel: 'Mitarbeiter anlegen'
  });
  
});

//Mitarbeiter anlegen & Weiterleitung auf Mitarbeiter Startseite
app.post('/mitarbeiter_anlegen', async (req, res) =>{
  var sql = 'INSERT INTO mitarbeiter (vorname, nachname) VALUES (?,?)';
  var variables = [req.body.vorname, req.body.nachname];
  var mitarbeiter = await database.queryDB(sql, variables);
  res.redirect('/mitarbeiter');
});

//Mitarbeiter aktualisieren Seite laden
app.get('/update_mitarbeiter/:id', async (req, res) =>{
  var sql = 'SELECT * FROM mitarbeiter WHERE id = ?';
  var variables = [req.params.id];
  var mitarbeiter = await database.queryDB(sql, variables);
  res.render('mitarbeiter/updateMitarbeiter', {
    style: 'index',
    titel: 'Mitarbeiter aktualisieren',
    data: mitarbeiter
  });
});

//Mitarbeiter aktualisieren & Weiterleitung auf Mitarbeiter Startseite
app.post('/update_mitarbeiter/:id' ,async (req, res) =>{
  var sql = 'UPDATE mitarbeiter SET vorname = ?, nachname = ? WHERE id=?';
  var variables = [req.body.vorname, req.body.nachname, req.params.id];
  var mitarbeiter = await database.queryDB(sql, variables);
  res.redirect('/mitarbeiter');
});




const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});