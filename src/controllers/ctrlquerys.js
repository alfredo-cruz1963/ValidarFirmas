const ctrlquerys = {};

const pool = require('../database');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');
const excelJS = require('exceljs');
const nameFileExcel = "firmas-Validas.xlsx";

//***** despliega la pagina para la consulta por planilla ****
ctrlquerys.add = (req, res) => {
  res.render('querys/planilla.hbs');
};

//***** despliega la pagina para la consulta por planilla ****
ctrlquerys.add1 = (req, res) => {
  res.render('querys/fecha.hbs');
};

//***** despliega la pagina con rango de fechas para consultar produccion de los usuarios  ****
ctrlquerys.rangofechas = (req, res) => {
  res.render('querys/rangofechas.hbs');
};

//***** despliega la pagina con la table donde se muestra la produccion de los usuarios ****
ctrlquerys.listproduc = async (req, res) => {
  const { desde, hasta } = req.body;

  mquery = `SELECT fvalidas.usuario,
    users.fullname AS nombre,
    COUNT(fvalidas.usuario) AS total
    FROM fvalidas
    INNER JOIN users
    ON fvalidas.usuario = users.username
    WHERE fvalidas.fecha >= ?
    AND fvalidas.fecha <= ?
    GROUP BY fvalidas.usuario, users.fullname
    ORDER BY fvalidas.usuario`

  var datos = await pool.query(mquery, [desde, hasta]);

  res.render('querys/listproduc.hbs', { datos });
};

// ************** Consulta por numero de planilla  *********************
ctrlquerys.list = async (req, res) => {
  const planilla = req.body.planilla;
  gopc = 1;
  const plan = planilla.padStart(6, '0');
  gplanilla = plan;
  const datos = await pool.query('SELECT * FROM vfirmasvalid WHERE planilla = ?', [plan]);
  
  if (datos.length > 0){
    res.render('querys/list.hbs', { datos });
  }else {
    req.flash('message', 'La planilla numero: ' + gplanilla + ', No se a registrado.');
    res.redirect('/querys/add');
  } 
};

// ************** Consulta por fecha de planilla  *********************
ctrlquerys.listdate = async (req, res) => {
  const fecha = req.body.fecha;
  gopc = 2;
  gfecha = fecha;
  const datos = await pool.query('SELECT * FROM vfirmasvalid WHERE fecha = ?', fecha);

  if (datos.length > 0){
    res.render('querys/list.hbs', { datos });
  }else {
    req.flash('message', 'En la fecha: ' + gfecha + ', No se a registrado Información.');
    res.redirect('/querys/add1');
  }  
};

// ************** Consulta por general  *********************
ctrlquerys.grid = async (req, res) => {
  const mopc = gopc;
  var query = '';
  var msearch = '';
  
  if (mopc == 1) {
    query = 'SELECT * FROM vfirmasvalid WHERE planilla = ?'
    msearch = gplanilla;
    
  }else {
    query = 'SELECT * FROM vfirmasvalid WHERE fecha = ?'
    msearch = gfecha;
  } 

  const dataux = await pool.query(query, [msearch]);
  res.render('querys/list.hbs', { datos: dataux });
};


// ********** despliega la pagina para editar las firmas validas *************
ctrlquerys.edit = async(req, res) => {
  const { cedula } = req.params;
  var mnombmpio = '';
  var mnombpto = '';
 
  const datos = await pool.query('SELECT * FROM fvalidas WHERE cedula = ?', [cedula]);
  
  var msexo = datos[0].sexo;
  if (msexo == '1') {
    var xsexo = true;
  }else {
    var xsexo = false;
  };
  
  mcodmpio = datos[0].codmpio;
  const cytes = await pool.query('SELECT * FROM dane WHERE codigo = ?', mcodmpio);
  mnombmpio = cytes[0].mpio;
  mcodpto = datos[0].puesto;
  const puestos = await pool.query('SELECT codigo, nombpuesto FROM puestosmeta WHERE codigo = ?', mcodpto);
  mnombpto = puestos[0].nombpuesto;

  res.render('querys/edit.hbs', { datos: datos[0], genero: xsexo, nombmpio: mnombmpio, nombpto: mnombpto });   
};

// ********** actualiza la BD de firmas validas *************
ctrlquerys.update = async (req, res) => {
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
    res.redirect('/querys/grid');   
  };
  
  // ************** Delete *********************
  ctrlquerys.delete = async (req, res) => {
    const { cedula } = req.params;
   
    await pool.query('DELETE FROM fvalidas WHERE CEDULA = ?', [cedula]);
    req.flash('success', 'La Firma fue Borrada Correctamente');
    res.redirect('/querys/grid');
  };

// ************** Exportar Firmas *********************
ctrlquerys.exportar = async (req, res) => {

  const firmas = await pool.query('SELECT * FROM vfirmasvalid');

  const workbook = new excelJS.Workbook();
  const sheet = workbook.addWorksheet('Firmas-Validas');
  const reColumns = [
    { header: 'CEDULA', key: 'cedula', width: 15 },
    { header: 'NOMBRE', key: 'nombre', width: 35 }, 
    { header: 'DIRECCION', key: 'dir', width: 25 },
    { header: 'BARRIO', key: 'barrio', width: 15 },
    { header: 'CELULAR', key: 'cel', width: 15 },
    { header: 'PUESTO VOTACION', key: 'nombpuesto', width: 45 },
    { header: 'MESA', key: 'mesa', width: 15 },
    { header: 'MUNICIPIO', key: 'mpio', width: 25 },
    { header: 'DIGITADOR', key: 'usuario', width: 20 }
  ]

  sheet.columns = reColumns;
  firmas.forEach(row => {
    sheet.addRow(row);
  });

  workbook.xlsx.writeFile(nameFileExcel).then((e) => {
    console.log('La se Guardo Correctamente');
    res.redirect('/querys/descargar');
  })
  .catch(() => {
    console.log('Ocurrio un problema');
  })
};

// ************** Descargar Excel Firmas *********************
ctrlquerys.descargar = (req, res) => {
  res.download(nameFileExcel);
};


// ************** Imprime las planillas *********************
ctrlquerys.print1 = async (req, res) => {
  const nombpdf = "planillas.pdf";
  const datos = await pool.query('SELECT * FROM vtotplanillas');
    
  let y = 105;
  let x = 45;
  var fila = 0;
  var posy = 0;
  var col = 1;

  const doc = new PDFDocument({ autoFirstPage: false });
  doc
    .addPage({margin: 45})
    .font('Helvetica-Bold', 12)
    .text('JHONATHAN DIAZ')
    .font('Helvetica-Bold', 10)
    .text('RENOVACION'+'\n')
    .text('Firmas Validas por Planilla'+'\n\n')
    .font('Helvetica-Bold', 7)
    .text('itm', x, 95)
    .text('Planilla', x+27, 95)
    .text('Nº', x+60, 95)
    
  for (i=0; i < datos.length; i++) {
    posy = y + 10*fila

    switch (col) {
      case 1:
        x=45;
        break;
      case 2:
        x=135;
        break;
      case 3:
        x=225;
        break;
      case 4:
        x=315;
        break;
      case 5:
        x=405;
        break;    
      case 6:
        x=495;
        break;        
    }

    doc
      .font('Helvetica-Bold', 7)
      .text((i+1).toString(), x, posy)
      .text(datos[i].planilla, x+27, posy)
      .text(datos[i].total.toString(), x+60, posy);

      fila++;
      if(fila > 62){
        y = 105;
        
        doc
          .font('Helvetica-Bold', 7)
          .text('itm', x, 95)
          .text('Planilla', x+27, 95)
          .text('Nº', x+60, 95);
    
        col++;
        fila = 0;
      }

      if((i+1) % 126 == 0 && col > 5){
        col = 1;

        doc
        .addPage({margin: 45})
        .font('Helvetica-Bold', 12)
        .text('JHONATHAN DIAZ')
        .font('Helvetica-Bold', 10)
        .text('RENOVACION'+'\n')
        .text('Firmas Validas por Planilla'+'\n\n')
        .font('Helvetica-Bold', 7)
        .text('itm', x, 95)
        .text('Planilla', x+27, 95)
        .text('Nº', x+60, 95)
    
      }
    }

  doc.pipe(fs.createWriteStream(path.join(__dirname, '../public/pdfs/' + nombpdf)));
  doc.end();
  res.render('querys/editor.hbs', { file: nombpdf });
};

// ************** Imprime las Relacion de firmas Registraduria *********************
ctrlquerys.print2 = async (req, res) => {
  const nombpdf = "firmasvalidas.pdf";
  const datos = await pool.query('SELECT * FROM vreportfirmas');

  let y = 105;
  let x = 40;
  var pos = 0;
  var posy = 0;
  var col = 1;

  const doc = new PDFDocument({ autoFirstPage: false });
  doc
    .addPage({margin: 40})
    .font('Helvetica-Bold', 12)
    .text('JHONATHAN DIAZ')
    .font('Helvetica-Bold', 10)
    .text('RENOVACION'+'\n')
    .text('Listado de Firmas para la Registraduria'+'\n\n')
    .font('Helvetica-Bold', 7)
    .text('item', x, 95)
    .text('cedula', x+25, 95)
    .text('Nombre', x+68, 95)
    .text('Planilla', x+230, 95)
    
   for (i=0; i < datos.length; i++) {
    posy = y + 10*pos

    doc
      .font('Helvetica-Bold', 7)
      .text((i+1).toString(), x, posy)
      .text(datos[i].cedula, x+25, posy)
      .text(datos[i].nombre.substr(0,35) , x+68, posy)
      .text(datos[i].planilla, x+230, posy);

      pos++;
      if(pos > 62){
        y = 105;
        x = 315;
        
        doc
          .font('Helvetica-Bold', 7)
          .text('item', x, 95)
          .text('cedula', x+25, 95)
          .text('Nombre', x+68, 95)
          .text('Planilla', x+230, 95);
    
        col=2;
        pos = 0;
      }

      if((i+1) % 126 == 0 && col == 2){
        col = 1;
        x=40;
        //doc.addPage({margin: 45}); 
        doc
        .addPage({margin: 40})
        .font('Helvetica-Bold', 12)
        .text('JHONATHAN DIAZ')
        .font('Helvetica-Bold', 10)
        .text('RENOVACION'+'\n')
        .text('Listado de Firmas para la Registraduria'+'\n\n')
        .font('Helvetica-Bold', 7)
        .text('item', x, 95)
        .text('cedula', x+25, 95)
        .text('Nombre', x+68, 95)
        .text('Planilla', x+230, 95)
      }
    }

  doc.pipe(fs.createWriteStream(path.join(__dirname, '../public/pdfs/' + nombpdf)));
  doc.end();
  res.render('querys/editor.hbs', { file: nombpdf });
};


//**********************************************************************************
// ************** Imprime las Relacion de firmas Registraduria *********************
ctrlquerys.print23 = async (req, res) => {
  const nombpdf = "firmasvalidas.pdf";
  const datos = await pool.query('SELECT * FROM vfirmasvalid');
  
  let y = 105;
  let x = 50;
  var pos = 0;
  var posy = 0;
  var col = 1;

  const defaultOptions = {
    margins: { top: 45, left: 40, right: 40, bottom: 45 },
    size: 'A4'
    //layout: 'landscape'
  };

  const doc = new PDFDocument({ autoFirstPage: false });
  doc.on('pageAdding', e => {
    e.options = defaultOptions;
  });

  //doc.addPage(defaultOptions);
  doc
    .addPage({margins: { top: 45, left: 40, right: 40, bottom: 45 }})
    .font('Helvetica-Bold', 12)
    .text('JHONATHAN DIAZ')
    .font('Helvetica-Bold', 10)
    .text('RENOVACION'+'\n')
    .text('Listado de Firmas para la Registraduria'+'\n\n')
    .font('Helvetica-Bold', 7)
    .text('item', x, 95)
    .text('cedula', x+25, 95)
    .text('Nombre', x+60, 95)
    .text('Planilla', x+225, 95)
//    .pipe(fs.createWriteStream(path.join(__dirname, '../public/pdfs/' + nombpdf)));

   for (i=0; i < datos.length; i++) {
    posy = y + 10*pos

    doc
      .font('Helvetica-Bold', 7)
      .text((i+1).toString(), x, posy)
      .text(datos[i].cedula, x+25, posy)
      .text(datos[i].nombre.substr(0,35) , x+60, posy)
      .text(datos[i].planilla, x+225, posy);

      pos++;
      if(pos > 62){
        y = 105;
        x = 315;
        doc
          .font('Helvetica-Bold', 7)
          .text('item', x, 95)
          .text('cedula', x+25, 95)
          .text('Nombre', x+60, 95)
          .text('Planilla', x+225, 95);
    
        col=2;
        pos = 0;
      }

      if((i+1) % 126 == 0 && col == 2){
        col = 1;
        x=50;

        doc
          //.addPage(defaultOptions)
          //.addPage({margin: 45}) 
          .addPage({margins: { top: 45, left: 40, right: 40, bottom: 45 }})
          .font('Helvetica-Bold', 7)
          .text('item', x, 95)
          .text('cedula', x+25, 95)
          .text('Nombre', x+60, 95)
          .text('Planilla', x+225, 95);
      }
    }

  doc.pipe(fs.createWriteStream(path.join(__dirname, '../public/pdfs/' + nombpdf))); 
  doc.end();
  res.render('querys/editor.hbs', { file: nombpdf });
};
module.exports = ctrlquerys;



