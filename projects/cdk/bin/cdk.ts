import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdasStack } from '../lib/lambdas.stack';

const app = new cdk.App();
const name = 'AngularExperiment';
const env = { account: '573634406871', region: 'eu-central-1' };

new LambdasStack(app, `${name}LambdasStack`, {
  env,
});
