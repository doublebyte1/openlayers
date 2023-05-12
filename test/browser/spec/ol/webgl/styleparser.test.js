import Feature from '../../../../../src/ol/Feature.js';
import {asArray} from '../../../../../src/ol/color.js';
import {
  packColor,
  parseLiteralStyle,
} from '../../../../../src/ol/webgl/styleparser.js';
import {uniformNameForVariable} from '../../../../../src/ol/style/expressions.js';

describe('ol.webgl.styleparser', function () {
  describe('parseLiteralStyle', function () {
    it('parses a style with variables', function () {
      const result = parseLiteralStyle({
        variables: {
          lower: 100,
          higher: 400,
        },
        symbol: {
          symbolType: 'square',
          size: [
            'interpolate',
            ['linear'],
            ['get', 'population'],
            ['var', 'lower'],
            4,
            ['var', 'higher'],
            8,
          ],
          color: '#336699',
          opacity: 0.5,
        },
      });

      const lowerUniformName = uniformNameForVariable('lower');
      const higherUniformName = uniformNameForVariable('higher');
      expect(result.builder.uniforms_).to.eql([
        `float ${lowerUniformName}`,
        `float ${higherUniformName}`,
      ]);
      expect(result.builder.attributes_).to.eql(['float a_population']);
      expect(result.builder.varyings_).to.eql([
        {
          name: 'v_population',
          type: 'float',
          expression: 'a_population',
        },
      ]);
      expect(result.builder.symbolColorExpression_).to.eql(
        'vec4(vec4(0.2, 0.4, 0.6, 1.0).rgb, vec4(0.2, 0.4, 0.6, 1.0).a * 0.5 * 1.0)'
      );
      expect(result.builder.symbolSizeExpression_).to.eql(
        `vec2(mix(4.0, 8.0, pow(clamp((a_population - ${lowerUniformName}) / (${higherUniformName} - ${lowerUniformName}), 0.0, 1.0), 1.0)))`
      );
      expect(result.builder.symbolOffsetExpression_).to.eql('vec2(0.0, 0.0)');
      expect(result.builder.texCoordExpression_).to.eql(
        'vec4(0.0, 0.0, 1.0, 1.0)'
      );
      expect(result.builder.symbolRotateWithView_).to.eql(false);
      expect(result.attributes.length).to.eql(1);
      expect(result.attributes[0].name).to.eql('population');
      expect(result.uniforms).to.have.property(lowerUniformName);
      expect(result.uniforms).to.have.property(higherUniformName);
    });

    it('parses a style with a filter', function () {
      const result = parseLiteralStyle({
        filter: ['between', ['get', 'attr0'], 0, 10],
        symbol: {
          symbolType: 'square',
          size: 6,
          color: '#336699',
        },
      });

      expect(result.builder.attributes_).to.eql(['float a_attr0']);
      expect(result.builder.varyings_).to.eql([
        {
          name: 'v_attr0',
          type: 'float',
          expression: 'a_attr0',
        },
      ]);
      expect(result.builder.symbolColorExpression_).to.eql(
        'vec4(vec4(0.2, 0.4, 0.6, 1.0).rgb, vec4(0.2, 0.4, 0.6, 1.0).a * 1.0 * 1.0)'
      );
      expect(result.builder.symbolSizeExpression_).to.eql('vec2(6.0)');
      expect(result.builder.symbolOffsetExpression_).to.eql('vec2(0.0, 0.0)');
      expect(result.builder.texCoordExpression_).to.eql(
        'vec4(0.0, 0.0, 1.0, 1.0)'
      );
      expect(result.builder.discardExpression_).to.eql(
        '!(v_attr0 >= 0.0 && v_attr0 <= 10.0)'
      );
      expect(result.builder.symbolRotateWithView_).to.eql(false);
      expect(result.attributes.length).to.eql(1);
      expect(result.attributes[0].name).to.eql('attr0');
    });

    it('correctly adds string variables to the string literals mapping', function () {
      const varName = 'mySize';
      const uniformName = uniformNameForVariable(varName);

      const result = parseLiteralStyle({
        variables: {
          mySize: 'abcdef',
        },
        symbol: {
          symbolType: 'square',
          size: ['match', ['var', varName], 'abc', 10, 'def', 20, 30],
          color: 'red',
        },
      });

      expect(result.uniforms[uniformName]()).to.be.greaterThan(0);
    });

    it('reads when symbol, stroke or fill styles are present', function () {
      const result = parseLiteralStyle({
        variables: {
          mySize: 'abcdef',
        },
        symbol: {
          symbolType: 'square',
          size: 1,
          color: 'red',
        },
        ['stroke-width']: 1,
        ['fill-color']: 'blue',
      });

      expect(result.hasSymbol).to.be(true);
      expect(result.hasStroke).to.be(true);
      expect(result.hasFill).to.be(true);
    });

    it('reads when symbol, stroke or fill styles are absent', function () {
      const result = parseLiteralStyle({
        variables: {
          mySize: 'abcdef',
        },
      });

      expect(result.hasSymbol).to.be(false);
      expect(result.hasStroke).to.be(false);
      expect(result.hasFill).to.be(false);
    });

    describe('symbol style', function () {
      it('without expressions', function () {
        const result = parseLiteralStyle({
          symbol: {
            symbolType: 'square',
            size: [4, 8],
            color: '#ff0000',
            rotateWithView: true,
          },
        });

        expect(result.builder.uniforms_).to.eql([]);
        expect(result.builder.attributes_).to.eql([]);
        expect(result.builder.varyings_).to.eql([]);
        expect(result.builder.symbolColorExpression_).to.eql(
          'vec4(vec4(1.0, 0.0, 0.0, 1.0).rgb, vec4(1.0, 0.0, 0.0, 1.0).a * 1.0 * 1.0)'
        );
        expect(result.builder.symbolSizeExpression_).to.eql(
          'vec2(vec2(4.0, 8.0))'
        );
        expect(result.builder.symbolOffsetExpression_).to.eql('vec2(0.0, 0.0)');
        expect(result.builder.texCoordExpression_).to.eql(
          'vec4(0.0, 0.0, 1.0, 1.0)'
        );
        expect(result.builder.symbolRotateWithView_).to.eql(true);
        expect(result.attributes).to.eql([]);
        expect(result.uniforms).to.eql({});
      });

      it('with expressions', function () {
        const result = parseLiteralStyle({
          symbol: {
            symbolType: 'square',
            size: ['get', 'attr1', 'number'],
            color: [255, 127.5, 63.75, 0.25],
            textureCoord: [0.5, 0.5, 0.5, 1],
            offset: [
              'match',
              ['get', 'attr3'],
              'red',
              [6, 0],
              'green',
              [3, 0],
              [0, 0],
            ],
          },
        });

        expect(result.builder.uniforms_).to.eql([]);
        expect(result.builder.attributes_).to.eql([
          'float a_attr1',
          'float a_attr3',
        ]);
        expect(result.builder.varyings_).to.eql([
          {
            name: 'v_attr1',
            type: 'float',
            expression: 'a_attr1',
          },
        ]);
        expect(result.builder.symbolColorExpression_).to.eql(
          'vec4(vec4(0.25, 0.125, 0.0625, 0.25).rgb, vec4(0.25, 0.125, 0.0625, 0.25).a * 1.0 * 1.0)'
        );
        expect(result.builder.symbolSizeExpression_).to.eql('vec2(a_attr1)');
        expect(result.builder.symbolOffsetExpression_).to.eql(
          '(a_attr3 == 1.0 ? vec2(6.0, 0.0) : (a_attr3 == 0.0 ? vec2(3.0, 0.0) : vec2(0.0, 0.0)))'
        );
        expect(result.builder.texCoordExpression_).to.eql(
          'vec4(0.5, 0.5, 0.5, 1.0)'
        );
        expect(result.builder.symbolRotateWithView_).to.eql(false);
        expect(result.attributes.length).to.eql(2);
        expect(result.attributes[0].name).to.eql('attr1');
        expect(result.attributes[1].name).to.eql('attr3');
        expect(result.uniforms).to.eql({});
      });

      it('with a uniform (texture)', function () {
        const result = parseLiteralStyle({
          symbol: {
            symbolType: 'image',
            src: '../data/image.png',
            size: 6,
            color: '#336699',
            opacity: 0.5,
          },
        });

        expect(result.builder.uniforms_).to.eql(['sampler2D u_texture']);
        expect(result.builder.attributes_).to.eql([]);
        expect(result.builder.varyings_).to.eql([]);
        expect(result.builder.symbolColorExpression_).to.eql(
          'vec4(vec4(0.2, 0.4, 0.6, 1.0).rgb, vec4(0.2, 0.4, 0.6, 1.0).a * 0.5 * 1.0) * texture2D(u_texture, v_texCoord)'
        );
        expect(result.builder.symbolSizeExpression_).to.eql('vec2(6.0)');
        expect(result.builder.symbolOffsetExpression_).to.eql('vec2(0.0, 0.0)');
        expect(result.builder.texCoordExpression_).to.eql(
          'vec4(0.0, 0.0, 1.0, 1.0)'
        );
        expect(result.builder.symbolRotateWithView_).to.eql(false);
        expect(result.attributes).to.eql([]);
        expect(result.uniforms).to.have.property('u_texture');
      });

      it('with a color interpolation', function () {
        const varName = 'ratio';
        const uniformName = uniformNameForVariable(varName);
        const result = parseLiteralStyle({
          variables: {
            [varName]: 0.5,
          },
          symbol: {
            symbolType: 'square',
            size: 6,
            color: [
              'interpolate',
              ['linear'],
              ['var', varName],
              0,
              [255, 255, 0],
              1,
              'red',
            ],
          },
        });

        expect(result.builder.attributes_).to.eql([]);
        expect(result.builder.varyings_).to.eql([]);
        expect(result.builder.symbolColorExpression_).to.eql(
          `vec4(mix(vec4(1.0, 1.0, 0.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0), pow(clamp((${uniformName} - 0.0) / (1.0 - 0.0), 0.0, 1.0), 1.0)).rgb, mix(vec4(1.0, 1.0, 0.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0), pow(clamp((${uniformName} - 0.0) / (1.0 - 0.0), 0.0, 1.0), 1.0)).a * 1.0 * 1.0)`
        );
        expect(result.builder.symbolSizeExpression_).to.eql('vec2(6.0)');
        expect(result.builder.symbolOffsetExpression_).to.eql('vec2(0.0, 0.0)');
        expect(result.builder.texCoordExpression_).to.eql(
          'vec4(0.0, 0.0, 1.0, 1.0)'
        );
        expect(result.builder.symbolRotateWithView_).to.eql(false);
        expect(result.attributes).to.eql([]);
        expect(result.uniforms).to.have.property(uniformName);
      });

      it('with a rotation expression using an attribute', function () {
        const result = parseLiteralStyle({
          symbol: {
            symbolType: 'square',
            size: 6,
            rotation: ['get', 'heading'],
          },
        });

        expect(result.builder.attributes_).to.eql(['float a_heading']);
        expect(result.builder.varyings_).to.eql([]);
        expect(result.builder.symbolRotationExpression_).to.eql('a_heading');
      });
    });

    describe('stroke style', function () {
      it('parses style', function () {
        const result = parseLiteralStyle({
          variables: {
            width: 1,
          },
          ['stroke-color']: [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0,
            'blue',
            1,
            'red',
          ],
          ['stroke-width']: ['*', ['var', 'width'], 3],
        });

        expect(result.builder.uniforms_).to.eql(['float u_var_width']);
        expect(result.builder.attributes_).to.eql(['float a_intensity']);
        expect(result.builder.varyings_).to.eql([
          {
            name: 'v_intensity',
            type: 'float',
            expression: 'a_intensity',
          },
        ]);
        expect(result.builder.strokeColorExpression_).to.eql(
          'mix(vec4(0.0, 0.0, 1.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0), pow(clamp((v_intensity - 0.0) / (1.0 - 0.0), 0.0, 1.0), 1.0))'
        );
        expect(result.builder.strokeWidthExpression_).to.eql(
          '(u_var_width * 3.0)'
        );
        expect(result.attributes.length).to.eql(1);
        expect(result.attributes[0].name).to.eql('intensity');
        expect(result.uniforms).to.have.property('u_var_width');
      });
    });

    describe('fill style', function () {
      it('parses style', function () {
        const result = parseLiteralStyle({
          variables: {
            scale: 10,
          },
          ['fill-color']: [
            'interpolate',
            ['linear'],
            ['*', ['get', 'intensity'], ['var', 'scale']],
            0,
            'blue',
            10,
            'red',
          ],
        });

        expect(result.builder.uniforms_).to.eql(['float u_var_scale']);
        expect(result.builder.attributes_).to.eql(['float a_intensity']);
        expect(result.builder.varyings_).to.eql([
          {
            name: 'v_intensity',
            type: 'float',
            expression: 'a_intensity',
          },
        ]);
        expect(result.builder.fillColorExpression_).to.eql(
          'mix(vec4(0.0, 0.0, 1.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0), pow(clamp(((v_intensity * u_var_scale) - 0.0) / (10.0 - 0.0), 0.0, 1.0), 1.0))'
        );
        expect(result.attributes.length).to.eql(1);
        expect(result.attributes[0].name).to.eql('intensity');
        expect(result.uniforms).to.have.property('u_var_scale');
      });
    });

    describe('handle attributes of types other that number', () => {
      let parseResult;
      beforeEach(() => {
        parseResult = parseLiteralStyle({
          ['fill-color']: [
            'case',
            ['get', 'transparent'],
            'transparent',
            ['get', 'fillColor'],
          ],
          ['stroke-width']: [
            'match',
            ['get', 'lineType'],
            'low',
            ['get', 'lineWidth'],
            'high',
            ['*', ['get', 'lineWidth'], 2],
            1.5,
          ],
          symbol: {
            symbolType: 'square',
            color: ['get', 'color'],
            size: ['get', 'iconSize', 'number[]'],
          },
        });
      });
      it('adds attributes to the shader builder', () => {
        expect(parseResult.builder.attributes_).to.eql([
          'vec4 a_iconSize',
          'vec2 a_color',
          'float a_lineType',
          'float a_lineWidth',
          'vec2 a_fillColor',
          'float a_transparent',
        ]);
      });
      it('adds varyings to the shader builder', () => {
        expect(parseResult.builder.varyings_).to.eql([
          {name: 'v_color', type: 'vec4', expression: 'unpackColor(a_color)'},
          {name: 'v_iconSize', type: 'vec4', expression: 'a_iconSize'},
          {name: 'v_lineType', type: 'float', expression: 'a_lineType'},
          {name: 'v_lineWidth', type: 'float', expression: 'a_lineWidth'},
          {
            name: 'v_fillColor',
            type: 'vec4',
            expression: 'unpackColor(a_fillColor)',
          },
          {name: 'v_transparent', type: 'float', expression: 'a_transparent'},
        ]);
      });
      it('adds unpack color function to the shader builder', () => {
        expect(parseResult.builder.vertexShaderFunctions_.length).to.eql(1);
        expect(parseResult.builder.vertexShaderFunctions_[0]).to.contain(
          'vec4 unpackColor('
        );
      });
      it('returns attributes with their callbacks in the result', () => {
        expect(parseResult.attributes).to.eql([
          {name: 'iconSize', size: 4, callback: {}},
          {name: 'color', size: 2, callback: {}},
          {name: 'lineType', size: 1, callback: {}},
          {name: 'lineWidth', size: 1, callback: {}},
          {name: 'fillColor', size: 2, callback: {}},
          {name: 'transparent', size: 1, callback: {}},
        ]);
      });
      it('processes the feature attributes according to their types', () => {
        const feature = new Feature({
          iconSize: [12, 18],
          color: 'pink',
          lineType: 'low',
          lineWidth: 0.5,
          fillColor: 'rgba(123, 240, 100, 0.3)',
          transparent: true,
        });
        expect(parseResult.attributes[0].callback(feature)).to.eql([12, 18]);
        expect(parseResult.attributes[1].callback(feature)).to.eql(
          packColor(asArray('pink'))
        );
        expect(parseResult.attributes[2].callback(feature)).to.be.a('number');
        expect(parseResult.attributes[3].callback(feature)).to.eql(0.5);
        expect(parseResult.attributes[4].callback(feature)).to.eql(
          packColor(asArray('rgba(123, 240, 100, 0.3)'))
        );
        expect(parseResult.attributes[5].callback(feature)).to.eql(1);
      });
    });

    describe('handle uniforms of types other that number', () => {
      let parseResult;
      beforeEach(() => {
        parseResult = parseLiteralStyle({
          variables: {
            iconSize: [12, 18],
            color: 'pink',
            lineType: 'low',
            lineWidth: 0.5,
            fillColor: 'rgba(123, 240, 100, 0.3)',
            transparent: true,
          },
          ['fill-color']: [
            'case',
            ['var', 'transparent'],
            'transparent',
            ['var', 'fillColor'],
          ],
          ['stroke-width']: [
            'match',
            ['var', 'lineType'],
            'low',
            ['var', 'lineWidth'],
            'high',
            ['*', ['var', 'lineWidth'], 2],
            1.5,
          ],
          symbol: {
            symbolType: 'square',
            color: ['var', 'color'],
            size: ['var', 'iconSize'],
          },
        });
      });
      it('adds uniforms to the shader builder', () => {
        expect(parseResult.builder.uniforms_).to.eql([
          'vec4 u_var_iconSize',
          'vec2 u_var_color',
          'float u_var_lineType',
          'float u_var_lineWidth',
          'vec2 u_var_fillColor',
          'float u_var_transparent',
        ]);
      });
      it('returns uniforms in the result', () => {
        expect(Object.keys(parseResult.uniforms)).to.eql([
          'u_var_iconSize',
          'u_var_color',
          'u_var_lineType',
          'u_var_lineWidth',
          'u_var_fillColor',
          'u_var_transparent',
        ]);
      });
      it('processes uniforms according to their types', () => {
        expect(parseResult.uniforms['u_var_iconSize']()).to.eql([12, 18]);
        expect(parseResult.uniforms['u_var_color']()).to.eql(
          packColor(asArray('pink'))
        );
        expect(parseResult.uniforms['u_var_lineType']()).to.be.a('number');
        expect(parseResult.uniforms['u_var_lineWidth']()).to.eql(0.5);
        expect(parseResult.uniforms['u_var_fillColor']()).to.eql(
          packColor(asArray('rgba(123, 240, 100, 0.3)'))
        );
        expect(parseResult.uniforms['u_var_transparent']()).to.eql(1);
      });
    });
  });

  describe('packColor', () => {
    it('compresses all the components of a color into a [number, number] array', () => {
      expect(packColor(asArray('red'))).to.eql([65280, 255]);
      expect(packColor(asArray('rgba(0, 255, 255, 0.5)'))).to.eql([255, 65408]);
    });
  });
});
