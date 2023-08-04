'use strict'

const { Options, Invoker, processor } = require('@asciidoctor/cli')
const converter = require('asciidoctor-pdf/lib/converter.js')
const path = require('node:path')
const pkg = require('../package.json')
const extensions = require('./extensions.js')

async function convertFiles (files, argv, options, verbose, preview) {
  for (const file of files) {
    if (verbose) {
      console.log(`converting file ${file.contents ? '-' : file.path}`)
    }
    await converter.convert(processor, file, options, argv.timings, argv.watch, preview)
  }
}

function buildStylesheetAttribute (cliOptions) {
  const stylesheetBase = path.resolve(__dirname, 'styles/base.css')
  const stylesheetFightingFantasy = path.resolve(__dirname, 'styles/ff.css')

  let actualStylesheets = [
    stylesheetBase,
    stylesheetFightingFantasy
  ]
  cliOptions.attributes
    .map(a => a.split('='))
    .filter(a => a[0] === 'stylesheet')
    .map(a => a[1])
    .flatMap(a => a.split(','))
    .forEach((a) => {
      if (a.startsWith('+')) {
        actualStylesheets.push(a.slice(1))
      } else {
        actualStylesheets = [a]
      }
    })
  return `stylesheet=${actualStylesheets.join(',')}`
}

class AsciiHeroOptions {
  constructor () {
    this.options = new Options({})
      .addOption('preview', {
        default: false,
        describe: 'open the otherwise headless browser for inspecting the generated HTML document (before it gets converted to PDF)',
        type: 'boolean'
      })
  }

  parse (argv) {
    return this.options.parse(argv)
  }
}

class AsciiHeroInvoker extends Invoker {
  async invoke () {
    const cliOptions = this.options
    const processArgs = cliOptions.argv.slice(2)
    const { args } = cliOptions
    const { verbose, version, files, preview } = args
    if (version || (verbose && processArgs.length === 1)) {
      this.showVersion()
      return { exit: true }
    }

    const stylesheetAttribute = buildStylesheetAttribute(cliOptions)
    cliOptions.attributes.push(stylesheetAttribute)

    const templates = require('asciidoctor-pdf/lib/document/document-converter.js').templates
    converter.registerTemplateConverter(processor, templates)

    extensions.register(processor.Extensions)

    const asciidoctorOptions = cliOptions.options
    Invoker.prepareProcessor(args, processor)
    if (files && files.length > 0) {
      const fileObjects = files.map(file => ({ path: file }))
      await convertFiles(fileObjects, args, asciidoctorOptions, verbose, preview)
      return { exit: true }
    }

    this.showHelp()
    return { exit: true }
  }

  version () {
    return `AsciiHero ${pkg.version} using ${super.version()}`
  }
}

module.exports = {
  AsciiHeroOptions,
  AsciiHeroInvoker,
  processor
}
