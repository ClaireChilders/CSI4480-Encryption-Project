const default_port = 8008;

const express = require('express');
require('dotenv').config();
var appLocals = require('./app-locals.js');
var dbconnect = require('./public/scripts/dbconnect.js');
const helmet = require('helmet');
const { encrypt, decrypt } = require('./public/scripts/encryption.js');
const { validateInput } = require('./public/scripts/validateInput.js');

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
    res.redirect('/encryption');
});

app.post('/insert', async(req, res) => {
    console.log(req.body);
    if (req.body.username == '' || req.body.password == '' || req.body.email == '') {
        res.redirect('/encryption?status=missing-data');
        return;
    }

    if (!validateInput(req.body.username) || !validateInput(req.body.password) || !validateInput(req.body.email)) {
        res.redirect('/encryption?status=bad-data');
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

    if (!validateInput(req.body.username)) {
        res.redirect('/encryption?status=bad-data');
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
    res.redirect('/encryption');
});

app.use((req, res, next) => {
    res.status(404).send('Not found.');
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send(`Uh oh! Something's wrong`);
});


app.listen(PORT, () => console.info(`listening on port ${PORT}`));