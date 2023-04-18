const default_port = 8008;

const express = require('express');
require('dotenv').config();
var appLocals = require('./app-locals.js');
var dbconnect = require('./public/scripts/dbconnect.js');
const helmet = require('helmet');
const { encrypt, decrypt } = require('./public/scripts/encryption.js');

// let tls;
// try {
//   tls = require('node:tls');
// } catch (err) {
//   console.error('tls support is disabled!');
// } 

const app = express();

app.use(express.json());        // to support JSON-encoded bodies
app.use(express.urlencoded({    // to support URL-encoded bodies
  extended: true
}));
app.use(helmet());
app.disable('x-powered-by');

app.locals = appLocals;

const PORT  = process.env.PORT || default_port;

app.set('view engine', 'ejs');

app.use(express.static('public/scripts'));



app.get('/', (req, res) => {
    res.render('pages/index');
});

app.get('/encryption', (req, res) => {
    res.render('pages/encryption');
});



app.post('/', (req, res) => {
    // const options = {
    //     // Necessary only if the server requires client certificate authentication.
    //     // key: fs.readFileSync('client-key.pem'),
    //     // cert: fs.readFileSync('client-cert.pem'),
      
    //     // Necessary only if the server uses a self-signed certificate.
    //     ca: [ fs.readFileSync('csi4480-cert.pem') ],
      
    //     // Necessary only if the server's cert isn't for "localhost".
    //     checkServerIdentity: () => { return null; },
    //   };
      
    //   const socket = tls.connect(8000, options, () => {
    //     console.log('client connected',
    //                 socket.authorized ? 'authorized' : 'unauthorized');
    //     process.stdin.pipe(socket);
    //     process.stdin.resume();
    //   });
    //   socket.setEncoding('utf8');
    //   socket.on('data', (data) => {
    //     console.log(data);
    //   });
    //   socket.on('end', () => {
    //     console.log('server ends connection');
    //   });

    res.redirect('/encryption');
});

app.post('/insert', async(req, res) => {
    console.log(req.body);
    if (req.body.username == '' || req.body.password == '' || req.body.email == '') {
        res.redirect('/encryption?status=missing-data');
        return;
    }

    var values = `(('${await encrypt(req.body.username, process.env.USER_KEY)}'), ('${await encrypt(req.body.password, process.env.PASS_KEY)}'), ('${await encrypt(req.body.email, process.env.EMAIL_KEY)}'))`;
    
    await dbconnect.connect();
    var result;
    try {
        result = await dbconnect.insert(
            `users`,
            `(username, password, email)`,
            values,
        );
    } catch (err) {
        console.error(err.message);
        await dbconnect.disconnect();
        res.redirect('/encryption?status=insert-error');
        return;
    }
    console.log(result);
    if ((result==='string' || result instanceof String)) {
        if (result.startsWith('ERROR') || result.startsWith('ORA')) {
            res.redirect('/encryption?status=insert-error');
            return;
        }
    } else {
        if (result == null || result == undefined || result == 'null' || result == '') {
            res.redirect('/encryption?status=insert-error');
            return;
        }
    }

    await dbconnect.commit();
    await dbconnect.disconnect();
    res.redirect('/encryption?status=insert-success');
});

app.post('/request', async(req, res) => {
    if (req.body.username == '') {
        res.redirect('/encryption?status=missing-data');
        return;
    }

    await dbconnect.connect();
    let data = await dbconnect.select(
        `users`,
        `username, password, email`,
        `username='${await encrypt(req.body.username, process.env.USER_KEY)}'`
    );
    await dbconnect.disconnect();
    //console.log(`Data: ${data.rows}`);
    if (data==null || data==undefined || data.rows==null || data.rows=='') {
        res.redirect('/encryption?status=username-error');
        return;
    }
    
    console.log(`password: ${await decrypt(data.rows[0][1], process.env.PASS_KEY)}`);
    console.log(`email: ${await decrypt(data.rows[0][2], process.env.EMAIL_KEY)}`);

    let formatData = {
        'username': await decrypt(data.rows[0][0], process.env.USER_KEY),
        'password': await decrypt(data.rows[0][1], process.env.PASS_KEY),
        'email': await decrypt(data.rows[0][2], process.env.EMAIL_KEY)
    };

    

    res.send(`
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-KK94CHFLLe+nY2dmCWGMq91rCGa5gtU4mk92HdvYe+M/SXH301p5ILy+dN9+nJOZ" crossorigin="anonymous">
        <main>
            <div class="container">
                <nav class="navbar navbar-expand-lg bg-body-tertiary rounded">
                    <div class="container-fluid">
                        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarsExample11" aria-controls="navbarsExample11" aria-expanded="false" aria-label="Toggle navigation">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                        <div class="collapse navbar-collapse d-lg-flex" id="navbarsExample11">
                            <a class="navbar-brand col-lg-3 me-0" href="/">CSI4480 Final Project</a>
                            <ul class="navbar-nav col-lg-6 justify-content-lg-center">
                                <li class="nav-item">
                                    <a class="nav-link" href="/encryption">Home</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="/">Log Out</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
            </div>
        </main>
        <div class="container text-center" style="margin-top: 80px;">
            <h1>Data Retrieved</h1>
            <p style="margin-left: 20px">Username: ${formatData.username}</p>
            <p style="margin-left: 20px">Password: ${formatData.password}</p>
            <p style="margin-left: 20px">Email: ${formatData.email}</p>
            <a class="btn btn-secondary d-inline-flex align-items-center" href="/encryption">Return</a>
        </div>
    `);
    //res.status(200).send(`Username: ${formatData.username}, Password: ${formatData.password}, Email: ${formatData.email}`);
    
});


app.get('/request', async(req, res) => {
    console.log('hello');
    res.redirect('/encryption');
});

/*
app.post('/create_session', (req, res) => {
    console.log(`got public key of client`);
    console.log(`generating shared access key...`);

    console.log(`forming connection with database...`);
    console.log(`encrypting shared access key for database...`);

    console.log(`creating id of the handshake between client and server...`);
    console.log(`storing handshake id and encrypted shared key in database...`);

    console.log(`encrypting shared access key with client's public key...`);
    
    console.log(`responding with handshake id and encrypted shared access key...`);

    res.redirect('/');
});

app.post('/request', (req, res) => {
    console.log(`got handshake id`);
    
    console.log(`forming connection with database...`);
    console.log(`searching for shared access key...`);
    console.log(`validating session...`);
    
    // bad session
    console.log(`invalid session.`);
    console.log(`deleting session record from database...`);
    console.log(`closing connection with database...`);

    // valid session
    console.log(`valid session`);
    console.log(`requesting data from database...`);
    console.log(`got row data`);
    console.log(`closing connection with database...`);
    console.log(`decrypting row data...`);

    console.log(`encrypting row data with shared access key...`);
    console.log(`sending encrypted data back to client...`);
});

app.post('/insert', (req, res) => {
    console.log(`got encrypted data and handshake id.`);
    
    console.log(`forming connection with database...`);
    console.log(`searching for shared access key...`);
    
    console.log(`validating session...`);

    // invalid session
    console.log(`invalid session.`);
    console.log(`deleting session record from database...`);
    console.log(`closing connection with database...`);

    // valid session
    console.log(`valid session.`);
    console.log(`decrypting encrypted data with shared access key...`);
    
    console.log(`encrypting data to be stored in database...`);
    console.log(`inserting encrypted data in database...`);
    console.log(`closing connection with database...`);

    console.log(`data successfully inserted into database.`);

});
*/

app.use((req, res, next) => {
    res.status(404).send('Not found.');
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send(`Uh oh! Something's wrong`);
});


/* const fs = require('fs');

const options = {
  key: fs.readFileSync('csi4480-key.pem'),
  cert: fs.readFileSync('csi4480-cert.pem'),

  // This is necessary only if using client certificate authentication.
  //requestCert: true,

  // This is necessary only if the client uses a self-signed certificate.
  //ca: [ fs.readFileSync('client-cert.pem') ]
}; */

/* const server = tls.createServer(options, (socket) => {
    console.log('server connected',
                socket.authorized ? 'authorized' : 'unauthorized');
    socket.write('welcome!\n');
    socket.setEncoding('utf8');
    socket.pipe(socket);
  });
  server.listen(8000, () => {
    console.log('server bound');
}); */

app.listen(PORT, () => console.info(`listening on port ${PORT}`));