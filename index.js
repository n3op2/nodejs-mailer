// DEPENDENCIES
// =============================================================================
const nodemailer = require('nodemailer');
const { htmlToText } = require('nodemailer-html-to-text');
const fs = require('fs');

// CREATE SMTP TRANSPORT
// =============================================================================
const smtpConfig = {
  host:
  port: '587',
  secure: false,
  auth: {
    user:
    pass:
  },
};
const transporter = nodemailer.createTransport(smtpConfig);
transporter.use('compile', htmlToText());

let dIncrement = 5000;
let delay = 0;
let tmp = [];

const compileTemplate = (t, cb) => {
  const p = `${process.cwd()}/${t}.html`;
  /* eslint security/detect-non-literal-fs-filename: 0 */
  fs.readFile(p, 'utf8', (err, data) => {
    if (err) {
      return cb(err);
    }
    cb(null, data);
  });
};

const sendMail = (t, o, cb) => {
  compileTemplate(t, (cErr, html) => {
    if (cErr) return cb(cErr);

    const eo = {
      to: o.to,
      from: 'pro@homyze.com',
      bcc: 'martin@homyze.com',
      subject: o.subject,
      html,
    };
    transporter.sendMail(eo, (err, info) => {
      cb(err, info);
    });
  });
};

const readContacts = () => new Promise((resolve, reject) => {
  const dir = `${process.cwd()}/scrapped/`
  const files = [];
  fs.readdir(dir, (err, filenames) => {
    filenames.shift();
    if (err) return reject(err);
    filenames.forEach((filename, i) => {
      fs.readFile(dir + filename, 'utf-8', (err, content) => {
        if (err) return reject(err);
        files.push({ name: filename, data: JSON.parse(content) })
        if (files.length === filenames.length) {
          resolve(files)
        }
      })
    });
  });
});

const readtContactsFile = () => new Promise(resolve => {
  fs.readFile(`${process.cwd()}/contacts.json`,'utf-8', (err, content) => {
    if (err) return resolve(err);
    resolve(JSON.parse(content));
  }); 
});

const sendMailPromise = (t, o, i) => new Promise((resolve) => {
  sendMail(t, o, (err, info) => {
    if (err) return resolve(err);
    console.log('INFO: ', info)

    tmp[i].sent = true;
    tmp[i].sentAt = new Date().getTime();
    console.log('contact: ', tmp[i])
    fs.writeFile('contacts.json', JSON.stringify(tmp), (err) => {
      if (err) return resolve(err)
      resolve('saved and sent');
    });
  })
});

const asyncFunction = async (t, o, i) => {
  await new Promise(resolve => setTimeout(resolve, delay));
  console.log(`processing contact [${i}] <${o.to}>`);
  return await sendMailPromise(t, o, i);
};

// TODO ammend a new file with the new contacts only
const compileSingleFile = async (name) => {
  const contacts = await readContacts();
  tmp = [];
  contacts.map((c) => {
    c.data.users.map((user) => {
      tmp.push(user);
    })
  });

  tmp = tmp.map((c) => {
    c.sent = false;
    c.createdAt = new Date().getTime();
    return c;
  });

  return new Promise(resolve => {
    fs.writeFile(name, JSON.stringify(tmp), (err) => {
      if (err) return resolve(err);
      resolve('saved...')
    });
  });
};

let n = 0;

(async () => {
  // await compileSingleFile('contacts.json')
  tmp = await readtContactsFile();

  await Promise.all(tmp.map((c, i) => {
    if (c.email && !c.sent && n < 1000) {
      delay += dIncrement;
      const o = {
        to: c.email,
        subject: 'Subject'
      };
      n++;
      asyncFunction('template_name', o, i);
    } else {
      console.log(`skipping: ${c.email}\nstatus: [${c.sent}].`);
    }
  }));
})();
