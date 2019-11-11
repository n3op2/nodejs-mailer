# nodejs-mailer

- Compiles single JSON contacts file out of scrapped invidual JSON files
- Keeps a track of contacts that have been contacted
- Sends email with the delay (promise based)

### Libraries / Modules
- strformat
- nodemailer

NPM Install. It will require a list of contacts normally it should be placed in the '/scrapped' folder in the following format:

JSON Object
{
  users: [
  {
    email: '',
    name: '',
    number: ''
  }]
}
