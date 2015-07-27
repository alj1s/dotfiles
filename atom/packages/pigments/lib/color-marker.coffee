{CompositeDisposable} = require 'atom'
{fill} = require './utils'

module.exports =
class ColorMarker
  constructor: ({@marker, @color, @text, @invalid}) ->
    @subscriptions = new CompositeDisposable
    @subscriptions.add @marker.onDidDestroy => @destroyed()
    @subscriptions.add @marker.onDidChange =>
      @destroy() unless @marker.isValid()

  destroy: ->
    return if @wasDestroyed
    @marker.destroy()

  destroyed: ->
    return if @wasDestroyed
    @subscriptions.dispose()
    {@marker, @color, @text} = {}
    @wasDestroyed = true

  match: (properties) ->
    return false if @wasDestroyed

    bool = true

    if properties.bufferRange?
      bool &&= @marker.getBufferRange().isEqual(properties.bufferRange)
    bool &&= properties.color.isEqual(@color) if properties.color?
    bool &&= properties.match is @text if properties.match?
    bool &&= properties.text is @text if properties.text?

    bool

  serialize: ->
    return if @wasDestroyed
    out = {
      markerId: String(@marker.id)
      bufferRange: @marker.getBufferRange().serialize()
      color: @color.serialize()
      text: @text
      variables: @color.variables
    }
    out.invalid = true unless @color.isValid()
    out

  convertContentToHex: ->
    hex = '#' + fill(@color.hex, 6)

    @marker.displayBuffer.buffer.setTextInRange(@marker.getBufferRange(), hex)

  convertContentToRGBA: ->
    if @color.alpha is 1
      rgba = "rgb(#{Math.round @color.red}, #{Math.round @color.green}, #{Math.round @color.blue})"
    else
      rgba = "rgba(#{Math.round @color.red}, #{Math.round @color.green}, #{Math.round @color.blue}, #{@color.alpha})"

    @marker.displayBuffer.buffer.setTextInRange(@marker.getBufferRange(), rgba)
