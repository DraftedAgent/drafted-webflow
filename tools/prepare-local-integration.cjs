'use strict';
// Generates an isolated, blocked package. No network requests or deployment.
require('./build-standalone.cjs').build({integrationPreparation:true});
