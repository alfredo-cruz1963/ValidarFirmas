const ctrlfirmas = {};
var mcedula = '';
var mnombre = '';
var mcodmpio = '';
var mcodcau = '';
var mnomcau = '';
var existe = true;

const puppeteer = require("puppeteer");
const ac = require("@antiadmin/anticaptchaofficial");
const pool = require('../database');
const config = require('../config');


// ********** despliega la pagina para comprobar la cedula *************
ctrlfirmas.add = (req, res) => {
  res.render('firmas/valida.hbs');
};

// ********** despliega la pagina para editar la cedula *************
ctrlfirmas.add1 = (req, res) => {
  res.render('firmas/inputcc.hbs');
};

// ************** valida si cedula ya fue verificada *****************
ctrlfirmas.valid = async (req, res) => {
  const micedula = req.body.cedula;
  mcedula = micedula;
  mnombre = "";
  const datos = await pool.query('SELECT * FROM fvalidas WHERE cedula = ?', micedula);

  if (datos.length > 0) {
    mcodmpio = datos[0].codmpio;
    mnombre = datos[0].nombres + ' ' + datos[0].apellidos;
    mcodcau = '01';
    mnomcau = 'YA FUE VERIFICADA';
    req.flash('message', 'La cedula numero: ' + micedula + ', YA fue digitada.');
    res.redirect('/firmas/view');
  } else {
    res.redirect('/firmas/muestra');
  };
};

// ****************** pagina para capturar la firma ya verificada ****************
ctrlfirmas.view = async (req, res) => {
  const causas = await pool.query('SELECT * FROM fcausales');
  res.render('firmas/novalidas.hbs', { causas: causas, cedula: mcedula, nombre: mnombre, codcau: mcodcau, mnomcau });
};

// ****************** Graba la cedula ya duplicada y ya verificada ********************
ctrlfirmas.savenv = async (req, res) => {
  const { cedula, nombre, causal, planilla, codmpio } = req.body;
  const newNull = {
    cedula,
    nombre,
    causal,
    planilla,
    codmpio
  };

  newNull.nombre = newNull.nombre.toUpperCase();
  newNull.planilla = newNull.planilla.padStart(6, '0');
  newNull.codmpio = mcodmpio;

  await pool.query('INSERT INTO fanuladas set ?', [newNull]);
  req.flash('success', 'La firma ya verificada, se guardo Correctamente');

  res.redirect('/firmas/add');
};

// ********** cosulta desde la pagina los datos del usuario en ADRES *************
ctrlfirmas.consultaAdres = async (req, res) => {
  const { cedula } = req.params;

  ac.setAPIKey(config.setapikey);
  const browserP = puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"], headless: true
  });

  try {
    (async () => {
      //solve and receive token envia direccion y captcha de la pagina
      let token = await ac.solveRecaptchaV2Proxyless('https://aplicaciones.adres.gov.co/bdua_internet/Pages/ConsultarAfiliadoWeb.aspx', '6LcchMAUAAAAALbph_uFlNWt0exLPvlXcwUhZ6hG');
      if (!token) {
        console.log('result: ' + token);
        return;
      }

      let page = await (await browserP).newPage();
      await page.setUserAgent('5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
      await page.goto('https://aplicaciones.adres.gov.co/bdua_internet/Pages/ConsultarAfiliadoWeb.aspx');

      await page.waitForTimeout(2000);
      await page.waitForSelector("#g-recaptcha-response");
      //await page.type("#tipoDoc", "1");
      await page.type("#txtNumDoc", cedula);

      await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${token}";`);

      await page.click("#btnConsultar");
      await page.waitForTimeout(2000);

      const pages = await (await browserP).pages();
      const filaSelector = '#GridViewBasica tr';
      const filas = await pages[2].$$(filaSelector);

      if (filas.length > 0) {

        const resultados = await Promise.all(filas.map(async (fila) => {
          const celdas = await fila.$$('td');
          const datosFila = {};

          // Extraer información de cada celda de la fila
          if (celdas && celdas.length >= 2) {
            datosFila.tipoDato = await celdas[0].evaluate(node => node.innerText);
            datosFila.Valor = await celdas[1].evaluate(node => node.innerText);
          }
          return datosFila;
        }));

        const datosAdres = {
          "cedula": resultados[2].Valor,
          "nombres": resultados[3].Valor,
          "apellidos": resultados[4].Valor
        }

        //await page.close();
        res.send(datosAdres);
      } else {
        res.send("Fallo");
      }
    })()
  } catch (error) {
    console.error('Ocurrió un error en la función asincrónica:', error);
  } finally { async () => await page.close() }
}

// ********** despliega la pagina para grabar las firmas validas *************
ctrlfirmas.muestra = async (req, res) => {
  //var mcodmpio = '';
  var mnombmpio = '';
  var mnombpto = '';
  var mcodpto = '';
  var mmesa = '';
  var msexo = 0;
  var mDpto;
  const datosAux = [];
  var datosUsuario = [];
  var flag = 0;

  let page;
  var datosCenso = {};
  existe = true;

  ac.setAPIKey(config.setapikey);
  const browserP = puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"], headless: true
  });

  const dbMeta = await pool.query('SELECT * FROM meta WHERE cedula = ?', mcedula);
  const cytes = await pool.query('SELECT codigo, mpio FROM dane');
  const puestos = await pool.query("SELECT codigo, nombpuesto FROM divipol WHERE codmpio = '52005'");

  mnombre = "";
  if (dbMeta.length > 0) {
    flag = 1;
    msexo = dbMeta[0].sexo;
    mnombre = dbMeta[0].nombres + ' ' + dbMeta[0].apellidos;
    mcodcau = '';
    mnomcau = 'Seleccione una causal';

    datosUsuario = {
      "cedula": dbMeta[0].cedula,
      "nombres": dbMeta[0].nombres,
      "apellidos": dbMeta[0].apellidos,
      "dir": dbMeta[0].dir,
      "barrio": dbMeta[0].barrio,
      "cel": dbMeta[0].tele,
      "sexo": dbMeta[0].sexo
    }
  }

  //Comprobar si esta en el censo electoral
  try {
    await (async () => {
      //solve and receive token
      let token = await ac.solveRecaptchaV2Proxyless('https://wsp.registraduria.gov.co/censo/consultar', '6LcthjAgAAAAAFIQLxy52074zanHv47cIvmIHglH');
      if (!token) {
        console.log('result: ' + token);
        return;
      }

      page = await (await browserP).newPage();
      await page.setUserAgent('5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
      await page.goto('https://wsp.registraduria.gov.co/censo/consultar');

      await page.type('#nuip', mcedula);
      await page.waitForSelector("#g-recaptcha-response");

      await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${token}";`);
      await page.click("#enviar");
      await page.waitForTimeout(3000);

      await page.waitForTimeout(2000);
      const mSelector = await page.$('#consulta');

      if (mSelector !== null) {
        //determinar si el selector es una tabla o un div
        const tagName = await page.evaluate(el => el.tagName, mSelector);

        if (tagName == 'TABLE') {
          // Selecciona la tabla y verifica numero de filas  
          const filaSelector = '#consulta tr';
          const filas = await page.$$(filaSelector);

          // extrae los datos de la tabla con la informacion del puesto de votacion
          for (let fila of filas) {
            const celdas = await fila.$$('td');
            const datosFila = {};

            if (celdas && celdas.length >= 2) {
              datosFila.nuip = await celdas[0].evaluate(node => node.innerText);
              datosFila.dpto = await celdas[1].evaluate(node => node.innerText);
              datosFila.mpio = await celdas[2].evaluate(node => node.innerText);
              datosFila.puesto = await celdas[3].evaluate(node => node.innerText);
              datosFila.mesa = await celdas[5].evaluate(node => node.innerText);
              mDpto = await celdas[1].evaluate(node => node.innerText);
              mMpio = await celdas[2].evaluate(node => node.innerText);

              datosCenso = datosFila;
              existe = true;
            }
          }
        } else {
          existe = false;
        }
      } else {
        existe = false;
      }

      //await page.close();
      if (mDpto == 'META' && mMpio == 'ACACIAS') {  // Censo solo para el municipio de Acacias - Meta
        existe = true;
      } else {
        existe = false;
      }

      if (existe) {
        //Ubica el codigo dane del municipio
        let mCiudad = datosCenso.mpio;
        mmesa = datosCenso.mesa;

        for (let i = 0; i < cytes.length; i++) {
          if (cytes[i].mpio == mCiudad) {
            mcodmpio = cytes[i].codigo;
            mnombmpio = cytes[i].mpio;
            break;
          }
        }

        //busca el codigo del puesto de votacion con los datos traidos de la divipole
        let mPuesto = datosCenso.puesto;

        for (let i = 0; i < puestos.length; i++) {
          if (puestos[i].codigo.substring(0, 5) == mcodmpio) {
            if (puestos[i].nombpuesto === mPuesto) {
              mcodpto = puestos[i].codigo;
              mnombpto = puestos[i].nombpuesto;
              break;
            }
          }
        }

        res.render('firmas/add.hbs', { puestos, mcodmpio, mnombmpio, mcodpto, mnombpto, mmesa, dcto: mcedula, datos: datosUsuario, genero: msexo, flag });
      } else {
        mcodcau = '04';
        mnomcau = 'NO ESTA REGISTRADA EN EL CENSO ELECTORAL';
        req.flash('message', 'La cedula numero: ' + mcedula + ', NO esta en el censo electoral.');
        res.redirect('/firmas/view');
      }
    })()
  } catch (error) {
    console.error('Ocurrió un error en la función asincrónica:', error);
  } finally { async () => await page.close() }
};

// *********** graba la firma *************************
ctrlfirmas.grabar = async (req, res) => {
  const { cedula, nombres, apellidos, dir, barrio, cel, codmpio, puesto, mesa, planilla, sexo, usuario, fecha } = req.body;
  const newFirma = {
    cedula,
    nombres,
    apellidos,
    dir,
    barrio,
    cel,
    codmpio,
    puesto,
    mesa,
    planilla,
    sexo,
    usuario: req.user.username,
    fecha: new Date()
  };

  newFirma.nombres = newFirma.nombres.toUpperCase();
  newFirma.apellidos = newFirma.apellidos.toUpperCase();
  newFirma.dir = newFirma.dir.toUpperCase();
  newFirma.barrio = newFirma.barrio.toUpperCase();
  newFirma.planilla = newFirma.planilla.padStart(6, '0');

  await pool.query('INSERT INTO fvalidas set ?', [newFirma]);
  req.flash('success', 'La firma se guardo Correctamente');

  res.redirect('/firmas/add');
};

// ********** despliega la pagina para editar las firmas validas *************
ctrlfirmas.edit = async (req, res) => {
  const micedula = req.body.cedula;
  mcedula = micedula;
  var mnombmpio = '';
  var mnombpto = '';

  const datos = await pool.query('SELECT * FROM fvalidas WHERE cedula = ?', micedula);

  if (datos.length > 0) {
    var msexo = datos[0].sexo;

    mcodmpio = datos[0].codmpio;
    const cytes = await pool.query('SELECT * FROM dane WHERE codigo = ?', mcodmpio);
    mnombmpio = cytes[0].mpio;
    mcodpto = datos[0].puesto;
    const puestos = await pool.query('SELECT codigo, nombpuesto FROM divipol WHERE codigo = ?', mcodpto);
    mnombpto = puestos[0].nombpuesto;

    res.render('firmas/edit.hbs', { datos: datos[0], genero: msexo, nombmpio: mnombmpio, nombpto: mnombpto });
  } else {
    req.flash('message', 'La cedula numero: ' + mcedula + ', No se a registrado.');
    res.redirect('/firmas/add1');
  }
};

// ********** actualiza la BD de firmas validas *************
ctrlfirmas.update = async (req, res) => {
  const micedula = req.body.cedula;
  const { cedula, nombres, apellidos, dir, barrio, cel, codmpio, puesto, mesa, sexo, planilla } = req.body;
  const newFirma = {
    cedula,
    nombres,
    apellidos,
    dir,
    barrio,
    cel,
    codmpio,
    puesto,
    mesa,
    sexo,
    planilla
  };

  newFirma.nombres = newFirma.nombres.toUpperCase();
  newFirma.apellidos = newFirma.apellidos.toUpperCase();
  newFirma.dir = newFirma.dir.toUpperCase();
  newFirma.barrio = newFirma.barrio.toUpperCase();
  newFirma.planilla = newFirma.planilla.padStart(6, '0');

  await pool.query('UPDATE fvalidas set ? WHERE cedula = ?', [newFirma, micedula]);
  req.flash('success', 'La Firma se Actualizado Correctamente');
  res.redirect('/home');
};

// ************** Delete *********************
ctrlfirmas.delete = async (req, res) => {
  const { cedula } = req.params;

  await pool.query('DELETE FROM fvalidas WHERE CEDULA = ?', [cedula]);
  req.flash('success', 'La Firma fue Borrada Correctamente');
  res.redirect('/home');
};

module.exports = ctrlfirmas;
