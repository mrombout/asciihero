#!/usr/bin/env node

const fs = require('fs')
const { execFileSync } = require('child_process')
const pdf2img = require('pdf-img-convert')
const looksSame = require('looks-same')
const path = require('path')
const chai = require('chai')
const expect = chai.expect

const examplesDir = './examples'
fs.readdirSync(examplesDir).forEach(async (exampleDir) => {
  const basePath = path.join(examplesDir, exampleDir)
  const adocFile = path.join(basePath, `${exampleDir}.adoc`)
  const pdfFile = path.join(basePath, `${exampleDir}.pdf`)
  const thumbnailFile = path.join(basePath, `${exampleDir}.png`)

  const pdf2imgOpts = {
    width: 620,
    height: 877,
    page_numbers: [1]
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
