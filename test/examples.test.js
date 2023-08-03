const fs = require('fs')
const { execSync } = require('child_process')
const pdf2img = require('pdf-img-convert')
const looksSame = require('looks-same')
const path = require('path')

const examplesDir = './examples'
fs.readdirSync(examplesDir).forEach((exampleDir) => {
  describe(exampleDir, async () => {
    const basePath = path.join(examplesDir, exampleDir)
    const adocFile = path.join(basePath, `${exampleDir}.adoc`)
    const expectedOutputFile = path.join(basePath, `${exampleDir}.pdf`)

    const tmpDir = fs.mkdtempSync(path.join(__dirname, exampleDir))
    const actualOutputFile = path.join(tmpDir, `${exampleDir}_actual.pdf`)

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it(exampleDir, async () => {
      execSync(`asciihero ${adocFile} --out-file ${actualOutputFile}`)

      const expectedOutputImg = await pdf2img.convert(expectedOutputFile)
      const actualOutputImg = await pdf2img.convert(actualOutputFile)

      expectedOutputImg.forEach(async (_, index) => {
        expect(actualOutputImg).toHaveLength(expectedOutputImg.length)

        const expectedPageFile = path.join(tmpDir, `${exampleDir}_${index}.png`)
        const actualPageFile = path.join(tmpDir, `${exampleDir}_actual_${index}.png`)
        const diffPageFile = path.join(basePath, `${exampleDir}_${index}_diff.png`)

        fs.writeFileSync(expectedPageFile, expectedOutputImg[index])
        fs.writeFileSync(actualPageFile, actualOutputImg[index])

        const expectedOutputImgFile = fs.readFileSync(expectedPageFile)
        const actualOutputImgFile = fs.readFileSync(actualPageFile)

        const { equal, diffImage, diffBounds } = await looksSame(expectedOutputImgFile, actualOutputImgFile, {
          createDiffImage: true
        })
        console.log(`difBounds: ${diffBounds.bottom}, ${diffBounds.left}, ${diffBounds.right}, ${diffBounds.top}}`)

        if (!equal) {
          await diffImage.save(diffPageFile)
          expect(equal).toEqual(true)
        }
      })
    }).timeout(5000)
  })
})
