import { Stack, StackProps, aws_lambda, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const lambdaDependencyLayer = new aws_lambda.LayerVersion(
      this,
      'AngularExperimentLambdaDependencyLayer',
      {
        code: aws_lambda.Code.fromAsset('./lib/lambdas/dependencies.zip'),
        compatibleRuntimes: [aws_lambda.Runtime.NODEJS_LATEST],
      }
    );

    const youtubeLambda = new aws_lambda.Function(
      this,
      'AngularExperimentYoutubeLambda',
      {
        code: aws_lambda.Code.fromAsset('./lib/lambdas/youtube'),
        handler: 'index.handler',
        runtime: aws_lambda.Runtime.NODEJS_LATEST,
        environment: {
          YOUTUBE_API_KEY: process.env['YOUTUBE_API_KEY'] as string,
        },
        layers: [lambdaDependencyLayer],
      }
    );

    const youtubeLambdaUrl = youtubeLambda.addFunctionUrl({
      authType: aws_lambda.FunctionUrlAuthType.NONE,
    });

    new CfnOutput(this, 'AngularExperimentYoutubeLambdaUrlOutput', {
      value: youtubeLambdaUrl.url,
    });
  }
}
