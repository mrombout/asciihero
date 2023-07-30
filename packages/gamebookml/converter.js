// GamebookConverter converts an AsciiHero document to a GamebookML document.
module.exports = class GamebookConverter {
  convert (node, transform, opts) {
    const nodeName = transform || node.getNodeName()
    if (nodeName === 'document') {
      return `<gamebook>
        ${node.getContent()}
      </gamebook>`
    }
    if (nodeName === 'section') {
      console.log(node.getRoles())
      if (node.hasRole('segment')) {
        return `<segment id="${node.getTitle()}">
          ${node.getContent()}
        </segment>`
      }
      if (node.hasRole('gameplay')) {
        return node.getContent()
      }

      return ''
    }
    if (nodeName === 'inline_quoted') {
      return node.getText()
    }
    if (nodeName === 'inline_anchor') {
      return node.getText()
    }
    if (nodeName === 'paragraph') {
      return `<text>
        ${node.getContent()}
      </text>`
    }
    if (nodeName === 'ulist') {
      let content = ''

      node.getItems().forEach((item) => {
        content += `${item.getContent()}\n`
      })

      return content
    }
    if (nodeName === 'table') {
      if (node.hasRole('choices')) {
        let content = ''

        node.getRows().getBody().forEach((i) => {
          const text = i[0].getContent()
          const segmentId = i[2].getContent()
          content += `<choice segment="${segmentId}">${text}</choice>\n`
        })

        // console.log(node.getRoles())
        // console.log(node.getRows().getBody()[0][0].getText())
        return content
      }
      if (node.getRoles().includes('combat')) {
        return `<table>
        combat
      </table>`
      }
    }

    // console.log(`node: ${node}`)
    // console.log(`transform: ${transform}`)
    // console.log(`opts: ${opts}`)
    // return node.getContent()
    console.log(`nodeName: ${nodeName}`)
    return 'BLA'
  }
}
