var Metalsmith    = require('metalsmith');
var sitemap       = require('metalsmith-mapsite');
var feed          = require('metalsmith-feed');
var defaultValues = require('metalsmith-default-values');
// HTML
var layouts       = require('metalsmith-layouts');
var drafts        = require('metalsmith-drafts');
var snippet       = require('metalsmith-snippet');
var markdown      = require('metalsmith-markdown');
var permalinks    = require('metalsmith-permalinks');
var collections   = require('metalsmith-collections');
var pagination    = require('metalsmith-pagination');
var tags          = require('metalsmith-tags');
// CSS
var sass          = require('metalsmith-sass');
var prefix        = require('metalsmith-autoprefixer');
// JS
var uglify        = require('metalsmith-uglify');
// IMAGES
var imagemin      = require('metalsmith-imagemin');

Metalsmith(__dirname)
  .source('source')
  .destination('_build')
  .metadata({
    site: {
      url: "https://wwwphenotonic.com",
      title: "Phenotonic",
      description: "Phenotonic provides the tools, expertise, and education for gardens of all varieties & gardeners of all skill levels.",
      keywords: "grow, growing, garden, gardening, consulting, consultants, consultant, consult, experts, expert, expertise, mmj, marijuana, vegetable, hydroponic, organic, hydroponics, hydro",
      snipcart: {
        key: "NmNhYWY2MGYtZTljYi00YzE4LThlNjktNGRhMGE2OTM2ZjAx"
      }
    },
    landing: {
      headline: "Introducing the Bloom Box",
      copy: "We made the best organic CO2 generator in the universe to give plants the happy life they deserve.",
      url: "/store/bloom-box",
      button: "Let's Grow"
    }
  })
  // CSS
  .use(sass({
    includePaths: require('node-neat').includePaths,
    outputStyle: 'compressed',
    outputDir: 'css/'
  }))
  .use(prefix())
  // JS
  .use(uglify({
    concat: 'js/main.js',
    removeOriginal: true
    }))
  // IMAGES
  .use(imagemin())
  // HTML
  .use(drafts())
  .use(collections({
    blog: {
      pattern: 'blog/**/*.md',
      sortBy: 'date',
      reverse: true
    },
    store: {
      pattern: 'store/**/*.md'
    },
    pages: {
      pattern: '*.md'
    }
  }))
  // Set default values
  .use(defaultValues([
    {
      pattern: 'store/**/*.md',
      defaults: {
        layout: 'product.jade'
      }
    },
    {
      pattern: 'blog/**/*.md',
      defaults: {
        layout: 'post.jade'
      }
    }
  ]))
  .use(pagination({
    'collections.blog': {
      perPage: 10,
      layout: 'blog.jade',
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
  .use(snippet({
    maxLength: 140
  }))
  .use(permalinks({
    pattern: ':collection/:title',
    relative: false,
    linksets: [{
      match: { collection: 'pages' },
      pattern: ':title',
    }]
  }))
  .use(tags({
    handle: 'tags',
    path:'tagged/:tag/index.html',
    pathPage: "tagged/:tag/:num/index.html",
    perPage: 10,
    layout: 'tag.jade',
    sortBy: 'date',
    reverse: true
  }))
  /* Eventual category implementation
  .use(tags({
    handle: 'categories',
    path:'store/categories/:tag/index.html',
    layout: 'category.jade'
  }))
  */
  .use(layouts({
    engine: 'jade',
    moment: require('moment'),
    directory: 'templates',
    default: 'default.jade',
    pattern: '**/*.html'
  }))
  .use(sitemap('https://phenotonic.com'))
  .use(feed({collection: 'blog'}))
  .build(function(err) {
    if (err) throw err;
  });