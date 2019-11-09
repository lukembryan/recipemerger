module.exports = {
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [
          {
            loader: 'vue-style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'less-loader',
            options: {
              strictMath: true
            }
          }
        ]
      }
    ]
  }
};
module.exports = {
  module: {
    rules: [
      {
        test: /\.less$/,
        loader: 'less-loader', // compiles Less to CSS
        options: {
          strictMath: true
        }
      }
    ]
  }
};
