function turnInlineMacro () {
  const self = this

  self.process(function (parent, target, attrs) {
    const referencedSegment = parent.document.findBy({ id: target })

    const segment = referencedSegment[0]
    const title = segment.getTitle()

    return self.createInline(parent, 'quoted', `xref:${target}[${title}]`, { type: 'strong' })
  })
}

function enemyInlineMacro () {
  const self = this

  self.process(function (parent, target, attrs) {
    const object = {
      name: target,
      attributes: attrs
    }
    const content = JSON.stringify(object)

    return self.createInline(parent, 'quoted', content)
  })
}

function choiceTreeProcessor () {
  const self = this

  self.process(function (doc) {
    const combatNodes = doc.findBy({ style: 'combat' })

    for (const combatNodeIndex in combatNodes) {
      const combatNode = combatNodes[combatNodeIndex]

      const attributes = doc.getAttribute('gamebook-combat-attributes').split(',').map(x => x.trim())

      let content = `[cols="${Array(attributes.length + 1).fill('1').join(',')}"]\n`
      content += '|===\n'

      let header = '|\n'
      for (const index in attributes) {
        const attribute = attributes[index]
        header += `| ${attribute}\n`
      }
      content += header
      content += '\n'

      for (const childBlockIndex in combatNode.blocks) {
        const childBlock = combatNode.blocks[childBlockIndex]

        const rawContent = childBlock.getText()
        const jsonContent = JSON.parse(rawContent)

        content += `|${jsonContent.name}\n`
        for (const attribute in jsonContent.attributes) {
          const value = jsonContent.attributes[attribute]
          content += `| ${value}\n`
        }
      }
      content += '|===\n'
      self.parseContent(combatNode.parent, content)

      const nodeIndex = combatNode.parent.blocks.indexOf(combatNode)
      combatNode.parent.blocks.splice(nodeIndex, 1)
    }
  })
}

function choiceInlineMacro () {
  const self = this

  self.positionalAttributes(['text'])
  self.process(function (parent, target, attrs) {
    return self.createInline(parent, 'quoted', attrs.text, { type: 'strong' })
  })
}

function segmentTreeProcessor () {
  const self = this

  self.process(function (doc) {
    const segmentNodes = doc.findBy({ context: 'section' }, function (section) {
      return section.sectname === 'segment'
    })

    let sectionIndex = 1
    for (const index in segmentNodes) {
      const node = segmentNodes[index]

      node.setId(node.title)
      node.setTitle(`${sectionIndex}`)
      node.addRole('segment')

      sectionIndex += 1
    }
  })
}

function choicesTreeProcessor () {
  const self = this

  self.process(function (doc) {
    const choicesNodes = doc.findBy({
      style: 'choices'
    })

    for (const choiceNodeIndex in choicesNodes) {
      const choiceNode = choicesNodes[choiceNodeIndex]

      const choices = []
      while (choiceNode.blocks.length > 0) {
        const choice = choiceNode.blocks.pop()
        choices.push(choice)
      }

      let content = '[.choices]\n'
      content += '[cols="10,1,>1"]\n'
      content += '|===\n'

      for (const index in choices.reverse()) {
        const choice = choices[index]

        const regex = /choice:([a-z0-9_]+)/g
        const matches = regex.exec(choice.text)
        const targetLink = matches[1]

        content += `| ${choice.text}\n`
        content += '| Turn to\n'
        content += `| turn:${targetLink}[]\n`
      }

      content += '|===\n'

      self.parseContent(choiceNode.parent, content)
    }

    return doc
  })
}

function shuffleTreeProcessor () {
  const self = this

  const shuffle = function (array) {
    let currentIndex = array.length
    let randomIndex

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
    }

    return array
  }

  self.process(function (doc) {
    // shuffle all nodes
    const gameplayNodes = doc.findBy({ role: 'gameplay' })
    for (const gameplayNodeIndex in gameplayNodes) {
      const gameplayNode = gameplayNodes[gameplayNodeIndex]

      const segmentNodes = gameplayNode.findBy({ context: 'section' }, function (section) {
        return section.sectname === 'segment'
      })

      for (const segmentNodeIndex in segmentNodes) {
        const segmentNode = segmentNodes[segmentNodeIndex]

        const blocksLenth = segmentNode.parent.blocks.length
        const firstOne = segmentNode.parent.blocks[0]
        const lastOne = segmentNode.parent.blocks[blocksLenth - 1]

        shuffle(segmentNode.parent.blocks)

        const firstIndex = segmentNode.parent.blocks.indexOf(firstOne)
        const otherValue1 = segmentNode.parent.blocks[0]
        segmentNode.parent.blocks[0] = firstOne
        segmentNode.parent.blocks[firstIndex] = otherValue1

        const lastIndex = segmentNode.parent.blocks.indexOf(lastOne)
        const otherValue2 = segmentNode.parent.blocks[blocksLenth - 1]
        segmentNode.parent.blocks[blocksLenth - 1] = lastOne
        segmentNode.parent.blocks[lastIndex] = otherValue2
      }
    }

    // re-assign all titles to be in order
    const nodes = doc.findBy({ context: 'section' }, function (section) {
      return section.sectname === 'segment'
    })

    let sectionIndex = 1
    for (const index in nodes) {
      const node = nodes[index]

      node.setTitle(`${sectionIndex}`)
      sectionIndex += 1
    }
  })
}

module.exports.register = function (registry) {
  registry.register(function () {
    this.inlineMacro('turn', turnInlineMacro)
    this.inlineMacro('enemy', enemyInlineMacro)
    this.treeProcessor('combat', choiceTreeProcessor)
    this.inlineMacro('choice', choiceInlineMacro)
    this.treeProcessor(segmentTreeProcessor)
    this.treeProcessor(choicesTreeProcessor)
    this.treeProcessor(shuffleTreeProcessor)
  })
}
