#!/usr/bin/env node

const fs = require('fs')
const { execFileSync } = require('child_process')
const pdf2img = require('pdf-img-convert')
const looksSame = require('looks-same')
const path = require('path')
const chai = require('chai')
const { example } = require('yargs')
const expect = chai.expect

const thumbnailPages = {
  "attributes": [2],
  "dice_footer": [3],
  "dice_table": [2],
  "images": [2],
  "input": [3],
  "manual_segment_number": [3],
  "shuffle": [3],
  "simple": [3],
  "stable_segments": [3],
  "stylesheet": [7],
}

const examplesDir = './examples'
fs.readdirSync(examplesDir).forEach(async (exampleDir) => {
  const basePath = path.join(examplesDir, exampleDir)
  const adocFile = path.join(basePath, `${exampleDir}.adoc`)
  const pdfFile = path.join(basePath, `${exampleDir}.pdf`)
  const thumbnailFile = path.join(basePath, `${exampleDir}.png`)

  const pdf2imgOpts = {
    width: 620,
    height: 877,
    page_numbers: thumbnailPages.hasOwnProperty(exampleDir) ? thumbnailPages[exampleDir] : [2]
  }
  const expectedOutputImgs = await pdf2img.convert(pdfFile, pdf2imgOpts)
  for (expectedOutputImg of expectedOutputImgs) {
    fs.writeFile(thumbnailFile, expectedOutputImg, (error) => {
      if (error) {
        console.log(`Error: ${error}`)
      }
    })
  }
})
