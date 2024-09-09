import { Stack, StackProps, aws_lambda, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class LambdasStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambdaDependencyLayer = new aws_lambda.LayerVersion(
      this,
      `${id}LambdaDependencyLayer`,
      {
        code: aws_lambda.Code.fromAsset('./lib/lambdas/dependencies.zip'),
        compatibleRuntimes: [aws_lambda.Runtime.NODEJS_LATEST],
      }
    );

    const youtubeLambda = new aws_lambda.Function(this, `${id}YoutubeLambda`, {
      code: aws_lambda.Code.fromAsset('./lib/lambdas/youtube'),
      handler: 'index.handler',
      runtime: aws_lambda.Runtime.NODEJS_LATEST,
      environment: {
        YOUTUBE_API_KEY: process.env['YOUTUBE_API_KEY'] as string,
      },
      layers: [lambdaDependencyLayer],
    });

    const youtubeLambdaUrl = youtubeLambda.addFunctionUrl({
      authType: aws_lambda.FunctionUrlAuthType.NONE,
    });

    new CfnOutput(this, `${id}YoutubeLambdaUrlOutput`, {
      value: youtubeLambdaUrl.url,
    });

    const expressLambda = new aws_lambda.Function(this, `${id}ExpressLambda`, {
      code: aws_lambda.Code.fromAsset('../../dist'),
      handler: 'youtube-glow/server/server.handler',
      runtime: aws_lambda.Runtime.NODEJS_LATEST,
      environment: {
        YOUTUBE_LAMBDA_URL: youtubeLambdaUrl.url,
      },
    });

    const expressLambdaUrl = expressLambda.addFunctionUrl({
      authType: aws_lambda.FunctionUrlAuthType.NONE,
    });

    new CfnOutput(this, `${id}ExpressLambdaUrlOutput`, {
      value: expressLambdaUrl.url,
    });
  }
}
