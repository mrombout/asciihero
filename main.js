import asciidoctor from 'asciidoctor' // (1)

const Asciidoctor = asciidoctor()

Asciidoctor.Extensions.register(function (registry) {
    registry.inlineMacro('turn', function () {
        var self = this;

        self.process(function (parent, target, attrs) {
            var referencedSegment = parent.document.findBy({ "id": target })

            var segment = referencedSegment[0]
            var title = segment.getTitle()

            return self.createInline(parent, "quoted", `xref:${target}[${title}]`, { "type": "strong" })
        });
    })
    registry.inlineMacro('enemy', function () {
        var self = this;

        self.process(function (parent, target, attrs) {
            var object = {
                "name": target,
                "attributes": attrs
            };
            var content = JSON.stringify(object)

            return self.createInline(parent, "quoted", content)
        });
    })
    registry.treeProcessor('combat', function () {
        var self = this;

        self.process(function (doc) {
            var nodes = doc.findBy({ "style": "combat" })

            for (var index in nodes) {
                var node = nodes[index];

                var attributes = doc.getAttribute("gamebook-combat-attributes").split(",").map(x => x.trim())

                var content = `[cols="${Array(attributes.length + 1).fill("1").join(",")}"]
|===
`
                var header = `|\n`
                for (var index in attributes) {
                    var attribute = attributes[index]
                    header += `| ${attribute}\n`
                }
                content += header
                content += "\n"

                for (var ci in node.blocks) {
                    var node2 = node.blocks[ci]

                    var rawContent = node2.getText()
                    var jsonContent = JSON.parse(rawContent)

                    content += `|${jsonContent.name}\n`
                    for (var attribute in jsonContent.attributes) {
                        var value = jsonContent.attributes[attribute]
                        content += `| ${value}\n`
                    }
                }
                content += "|===\n"
                self.parseContent(node.parent, content)

                var nodeIndex = node.parent.blocks.indexOf(node)
                node.parent.blocks.splice(nodeIndex, 1);
            }
        })
    });
    registry.inlineMacro('choice', function () {
        var self = this
        self.positionalAttributes(["text"])
        self.process(function (parent, target, attrs) {
            return self.createInline(parent, "quoted", attrs.text, { "type": "strong" })
        })
    })
    registry.treeProcessor(function () {
        var self = this;

        self.process(function (doc) {
            var nodes = doc.findBy({ "context": "section" }, function (section) {
                return section.sectname == "segment"
            })

            var sectionIndex = 1;
            for (var index in nodes) {
                var node = nodes[index];

                node.setId(node.title)
                node.setTitle(`${sectionIndex}`)
                node.addRole("segment")
                sectionIndex += 1
            }
        });
    });
    registry.treeProcessor(function () {
        var self = this // TreeProcessor
        self.process(function (doc) {
            var nodes = doc.findBy({
                "style": "choices"
            })

            for (var ulistIndex in nodes) {
                var ulist = nodes[ulistIndex]

                var choices = []
                while (ulist.blocks.length > 0) {
                    var choice = ulist.blocks.pop()
                    choices.push(choice)
                }

                var content = `[.choices]
[cols="10,1,>1"]
|===
`;
                for (var index in choices.reverse()) {
                    var choice = choices[index]

                    const regex = /choice:([a-z0-9_]+)/g;
                    var matches = regex.exec(choice.text)
                    var target_link = matches[1]

                    content += `| ${choice.text}
| Turn to
| turn:${target_link}[]
`
                }

                content += `|===`;

                self.parseContent(ulist.parent, content)
            }

            return doc
        })
    });
    registry.treeProcessor(function () {
        var self = this

        var shuffle = function (array) {
            let currentIndex = array.length, randomIndex;

            // While there remain elements to shuffle.
            while (currentIndex != 0) {

                // Pick a remaining element.
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;

                // And swap it with the current element.
                [array[currentIndex], array[randomIndex]] = [
                    array[randomIndex], array[currentIndex]];
            }

            return array;
        }


        self.process(function (doc) {
            // shuffle all nodes
            var gameplayNodes = doc.findBy({ "role": "gameplay" })
            for (var gameplayNodeIndex in gameplayNodes) {
                var gameplayNode = gameplayNodes[gameplayNodeIndex]

                var segmentNodes = gameplayNode.findBy({ "context": "section" }, function (section) {
                    return section.sectname == "segment"
                })

                for (var segmentNodeIndex in segmentNodes) {
                    var segmentNode = segmentNodes[segmentNodeIndex]

                    var blocksLenth = segmentNode.parent.blocks.length
                    var firstOne = segmentNode.parent.blocks[0]
                    var lastOne = segmentNode.parent.blocks[blocksLenth - 1]

                    shuffle(segmentNode.parent.blocks)

                    var firstIndex = segmentNode.parent.blocks.indexOf(firstOne)
                    var otherValue = segmentNode.parent.blocks[0];
                    segmentNode.parent.blocks[0] = firstOne
                    segmentNode.parent.blocks[firstIndex] = otherValue 

                    var lastIndex = segmentNode.parent.blocks.indexOf(lastOne)
                    var otherValue = segmentNode.parent.blocks[blocksLenth - 1];
                    segmentNode.parent.blocks[blocksLenth - 1] = lastOne
                    segmentNode.parent.blocks[lastIndex] = otherValue
                }
            }

            // re-assign all titles to be in order
            var nodes = doc.findBy({ "context": "section" }, function (section) {
                return section.sectname == "segment"
            })

            var sectionIndex = 1;
            for (var index in nodes) {
                var node = nodes[index];

                node.setTitle(`${sectionIndex}`)
                sectionIndex += 1
            }
        })
    })
})

var file = "./examples/simple/book.adoc";
var options = {
    "to_file": true,
    "mkdirs": true,
    "attributes": {
        "stylesheet": "../../stylesheet.css"
    }
};

// const doc = Asciidoctor.loadFile(file)
// const res = doc.convert(options);

Asciidoctor.convertFile(file, options)