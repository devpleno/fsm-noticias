const express = require('express')
const app = express()
const path = require('path')
const port = process.env.PORT || 3000
const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const User = require('./models/user')
const noticias = require('./routes/noticias')
const restrito = require('./routes/restrito')
const session = require('express-session')
const bodyParser = require('body-parser')

const mongo = process.env.MONGODB || 'mongodb://localhost/noticias'

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(session({ secret: 'fullstack-master' }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

app.use((req, res, next) => {
  if ('user' in req.session) {
    res.locals.user = req.session.user
  }
  next()
})

app.use('/restrito', (req, res, next) => {
  if ('user' in req.session) {
    return next()
  }
  // res.send('precisa logar')
  res.redirect('/login')
})

app.use('/restrito', restrito)
app.use('/noticias', noticias)

app.get('/login', (req, res) => {
  res.render('login')
})

app.post('/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username })
  const isValid = await user.checkPassword(req.body.password)

  if (isValid) {
    req.session.user = user
    res.redirect('/restrito/noticias')
  } else {
    res.redirect('/login')
  }
})

const createInitialUser = async () => {
  const total = await User.count({ username: 'tuliofaria' })
  if (total === 0) {
    const user = new User({
      username: 'tuliofaria',
      password: 'abc123'
    })
    await user.save()
    console.log('user created')
  } else {
    console.log('user created skipped')
  }
}

app.get('/', (req, res) => res.render('index'))
mongoose
  .connect(mongo, { useMongoClient: true })
  .then(() => {
    createInitialUser()
    app.listen(port, () => console.log('listening...'))
  })
  .catch(e => console.log(e))