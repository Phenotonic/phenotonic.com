var fs = require('fs')
var globcat = require('globcat')
// Metalsmith
var Metalsmith = require('metalsmith')
var sitemap = require('metalsmith-mapsite')
var feed = require('metalsmith-feed')
var defaultValues = require('metalsmith-default-values')
// HTML
var layouts = require('metalsmith-layouts')
var drafts = require('metalsmith-drafts')
var markdown = require('metalsmith-markdown')
var permalinks = require('metalsmith-permalinks')
var collections = require('metalsmith-collections')
var pagination = require('metalsmith-pagination')
var tags = require('metalsmith-tags')
var minify = require('metalsmith-html-minifier')
// Javascript
var uglify = require('uglify-js')
// PostCSS
var postcss = require('postcss')

/* Metalsmith
 ******************************************************************************/

var siteBuild = Metalsmith(__dirname)
  .source('source')
  .destination('_build')
  .metadata({
    site: {
      url: 'https://www.phenotonic.com/',
      title: 'Phenotonic',
      description: 'Phenotonic provides the tools, expertise, and education for gardens of all varieties & gardeners of all skill levels.',
      keywords: 'grow, growing, garden, gardening, consulting, consultants, consultant, consult, experts, expert, expertise, mmj, marijuana, vegetable, hydroponic, organic, hydroponics, hydro'
    }
  })
  // HTML
  .use(drafts())
  .use(collections({
    blog: {
      pattern: 'blog/**/*.md',
      sortBy: 'date',
      reverse: true
    },
    products: {
      pattern: 'products/**/*.md',
      sortBy: 'position',
      reverse: true
    },
    pages: {
      pattern: '*.md'
    }
  }))
  // Set default values
  .use(defaultValues([
    {
      pattern: 'products/**/*.md',
      defaults: {
        layout: 'product.pug'
      }
    },
    {
      pattern: 'blog/**/*.md',
      defaults: {
        layout: 'post.pug'
      }
    }
  ]))
  .use(pagination({
    'collections.blog': {
      perPage: 10,
      layout: 'blog.pug',
      first: 'blog/index.html',
      noPageOne: true,
      path: 'blog/page/:num/index.html',
      pageMetadata: {
        title: 'Blog',
        headline: 'Adventures in Gardening',
        description: 'The Phenotonic Blog'
      }
    }
  }))
  .use(markdown({
    gfm: true,
    smartypants: true,
    tables: true
  }))
  .use(permalinks({
    pattern: ':collection/:title',
    relative: false,
    linksets: [{
      match: { collection: 'pages' },
      pattern: ':title'
    }]
  }))
  .use(tags({
    handle: 'tags',
    path: 'tagged/:tag/index.html',
    pathPage: 'tagged/:tag/:num/index.html',
    perPage: 10,
    layout: 'tag.pug',
    sortBy: 'date',
    reverse: true
  }))
  /*
  .use(tags({
    handle: 'categories',
    path:'products/categories/:tag/index.html',
    layout: 'products.pug'
  }))
  */
  .use(tags({
    handle: 'manufacturer',
    path: 'products/manufacturer/:tag/index.html',
    layout: 'manufacturer.pug'
  }))
  .use(layouts({
    engine: 'pug',
    pretty: true,
    moment: require('moment'),
    directory: 'templates',
    default: 'default.pug',
    pattern: '**/*.html'
  }))
  .use(sitemap('https://phenotonic.com'))
  .use(feed({collection: 'blog'}))

if (process.env.NODE_ENV === 'production') {
  siteBuild.use(minify())
}

siteBuild.build(function (err) {
  if (err) {
    console.log(err)
  } else {
    console.log('Metalsmith complete!\n')
    scripts()
    stylesheets()
  }
})

/* JavaScript
 ******************************************************************************/

function scripts () {
  fs.mkdirSync('_build/js')

  var js = globcat('js/**/*.js')

  js.then(function (contents) {
    if (process.env.NODE_ENV === 'production') {
      var result = uglify.minify([contents], { fromString: true })
      fs.writeFileSync('_build/js/main.js', result.code, 'utf-8')
    } else {
      fs.writeFileSync('_build/js/main.js', contents, 'utf-8')
    }
    console.log('JavaScript complete!\n')
  })

  js.catch(function (err) {
    console.log(err)
  })
}

/* PostCSS
 ******************************************************************************/

function stylesheets () {
  var css = fs.readFileSync('css/main.css', 'utf-8')

  var plugins = [
    require('postcss-import'),
    require('postcss-neat')({
      neatMaxWidth: '64rem'
    }),
    require('postcss-nested'),
    require('postcss-custom-properties'),
    require('postcss-custom-media'),
    require('postcss-extend'),
    require('postcss-clearfix'),
    require('postcss-color-function'),
    require('postcss-fontpath'),
    require('postcss-pseudo-class-enter'),
    require('autoprefixer')({
      browsers: ['last 2 versions', '> 5%']
    })
  ]

  if (process.env.NODE_ENV === 'production') {
    plugins.push(
      require('postcss-uncss')({
        html: ['_build/**/*.html'],
        ignore: [/.modal/]
      })
    )
  }

  // Make sure cssnano is ran after uncss
  plugins.push(
    require('css-mqpacker'),
    require('cssnano')
  )

  postcss(plugins)
    .process(css, {
      from: 'css/main.css',
      to: '_build/css/main.css',
      map: { inline: false }
    })
    .then(function (result) {
      if (result.warnings()) {
        result.warnings().forEach(warn => {
          console.warn(warn.toString())
        })
      }
      fs.mkdirSync('_build/css')
      fs.writeFileSync('_build/css/main.css', result.css, 'utf-8')
      if (result.map) fs.writeFileSync('_build/css/main.css.map', result.map, 'utf-8')
      console.log('PostCSS complete!\n')
    })
}
