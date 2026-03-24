The `fixtures` directory is currently serving two purposes
1. The interim database for storing articles, feeds, and embeddings
2. The data source for openfeed-backend tests

Hopefully in the future we won't have need for this directory at all.
1. We would have an actual database
2. Any test related data can live in the test directory