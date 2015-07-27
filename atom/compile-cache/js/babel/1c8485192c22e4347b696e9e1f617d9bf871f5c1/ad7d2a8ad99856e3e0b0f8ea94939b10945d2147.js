module.exports = function (grunt) {
    'use strict';

    var srcDir = 'lib';

    grunt.initConfig({
        ts: {
            options: {
                target: 'es5',
                module: 'commonjs',
                sourceMap: false,
                preserveConstEnums: true,
                compiler: './node_modules/typescript/bin/tsc'
            },
            dev: {
                src: [srcDir + '/**/*.ts'],
                watch: srcDir,
                outDir: './dist/',
                baseDir: './lib/'
            },
            build: {
                src: [srcDir + '/**/*.ts'],
                outDir: './dist/',
                baseDir: './lib/'
            }
        }
    });

    grunt.loadNpmTasks('grunt-ts');
    grunt.registerTask('default', ['ts:dev']);
    grunt.registerTask('build', ['ts:build']);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvR3J1bnRmaWxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBQyxPQUFPLEdBQUcsVUFBVSxLQUFLLEVBQUU7QUFDOUIsZ0JBQVksQ0FBQzs7QUFFYixRQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7O0FBRW5CLFNBQUssQ0FBQyxVQUFVLENBQUM7QUFDYixVQUFFLEVBQUU7QUFDQSxtQkFBTyxFQUFFO0FBQ0wsc0JBQU0sRUFBRSxLQUFLO0FBQ2Isc0JBQU0sRUFBRSxVQUFVO0FBQ2xCLHlCQUFTLEVBQUUsS0FBSztBQUNoQixrQ0FBa0IsRUFBRSxJQUFJO0FBQ3hCLHdCQUFRLEVBQUUsbUNBQW1DO2FBQ2hEO0FBQ0QsZUFBRyxFQUFFO0FBQ0QsbUJBQUcsRUFBRSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUM7QUFDMUIscUJBQUssRUFBRSxNQUFNO0FBQ2Isc0JBQU0sRUFBRSxTQUFTO0FBQ2pCLHVCQUFPLEVBQUUsUUFBUTthQUNwQjtBQUNELGlCQUFLLEVBQUU7QUFDSCxtQkFBRyxFQUFFLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQztBQUMxQixzQkFBTSxFQUFFLFNBQVM7QUFDakIsdUJBQU8sRUFBRSxRQUFRO2FBQ3BCO1NBQ0o7S0FDSixDQUFDLENBQUM7O0FBRUgsU0FBSyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMvQixTQUFLLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDMUMsU0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0NBQzdDLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdC9HcnVudGZpbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChncnVudCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBzcmNEaXIgPSAnbGliJztcblxuICAgIGdydW50LmluaXRDb25maWcoe1xuICAgICAgICB0czoge1xuICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICAgIHRhcmdldDogJ2VzNScsXG4gICAgICAgICAgICAgICAgbW9kdWxlOiAnY29tbW9uanMnLFxuICAgICAgICAgICAgICAgIHNvdXJjZU1hcDogZmFsc2UsXG4gICAgICAgICAgICAgICAgcHJlc2VydmVDb25zdEVudW1zOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbXBpbGVyOiAnLi9ub2RlX21vZHVsZXMvdHlwZXNjcmlwdC9iaW4vdHNjJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRldjoge1xuICAgICAgICAgICAgICAgIHNyYzogW3NyY0RpciArICcvKiovKi50cyddLFxuICAgICAgICAgICAgICAgIHdhdGNoOiBzcmNEaXIsXG4gICAgICAgICAgICAgICAgb3V0RGlyOiAnLi9kaXN0LycsXG4gICAgICAgICAgICAgICAgYmFzZURpcjogJy4vbGliLydcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgICAgIHNyYzogW3NyY0RpciArICcvKiovKi50cyddLFxuICAgICAgICAgICAgICAgIG91dERpcjogJy4vZGlzdC8nLFxuICAgICAgICAgICAgICAgIGJhc2VEaXI6ICcuL2xpYi8nXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgZ3J1bnQubG9hZE5wbVRhc2tzKCdncnVudC10cycpO1xuICAgIGdydW50LnJlZ2lzdGVyVGFzaygnZGVmYXVsdCcsIFsndHM6ZGV2J10pO1xuICAgIGdydW50LnJlZ2lzdGVyVGFzaygnYnVpbGQnLCBbJ3RzOmJ1aWxkJ10pO1xufTtcbiJdfQ==