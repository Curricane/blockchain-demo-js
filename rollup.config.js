import babel from 'rollup-plugin-babel'

export default [
    {
        input: 'src/blockChain.js',
        output: {
            file: 'dist/blockChain.js',
            format: 'cjs'
        },
        plugins: [
            babel({
                "presets": [[
                    "env",
                    {
                        "modules": false,
                        "targets": {
                            "node": "current"
                          }
                    }
                ]]
                
            })
        ]
    },
    {
        input: 'test/test.js',
        output: {
            file: 'dist/test.js',
            format: 'cjs',
        },
        plugins: [
            babel({
                "presets": [[
                    "env",
                    {
                        "modules": false,
                        "targets": {
                            "node": "current"
                          }
                    }
                ]]
                
            })
        ]
    }
]