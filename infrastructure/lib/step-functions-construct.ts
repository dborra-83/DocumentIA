import * as cdk from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

/**
 * Props for Step Functions Construct
 */
export interface StepFunctionsConstructProps {
  bedrockProcessorFunction: lambda.IFunction;
  errorHandlerFunction: lambda.IFunction;
  stepFunctionsTriggerFunction: lambda.IFunction;
  documentsBucket: s3.IBucket;
  environment: string;
}

/**
 * Construct for creating Step Functions state machine for document processing workflow
 * 
 * Workflow:
 * 1. S3 upload triggers Step Functions execution
 * 2. ExtractText state: Invoke BedrockProcessor Lambda
 * 3. CheckStatus state: Check if processing was successful
 * 4. Success: End execution
 * 5. Error: HandleError state (update document status to failed)
 * 
 * Requirements: 4.1, 15.1
 */
export class StepFunctionsConstruct extends Construct {
  public readonly stateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: StepFunctionsConstructProps) {
    super(scope, id);

    // Define retry policy for Lambda invocations
    // 3 attempts with exponential backoff
    const retryPolicy: sfn.RetryProps[] = [
      {
        errors: ['States.TaskFailed', 'States.Timeout', 'Lambda.ServiceException', 'Lambda.TooManyRequestsException'],
        interval: cdk.Duration.seconds(2),
        maxAttempts: 3,
        backoffRate: 2.0,
      },
    ];

    // Define terminal states first
    const successState = new sfn.Succeed(this, 'ProcessingSucceeded', {
      comment: 'Document processing completed successfully',
    });

    const failState = new sfn.Fail(this, 'ProcessingFailed', {
      comment: 'Document processing failed',
    });

    // Define HandleError task - Invoke error handler Lambda
    const handleErrorTask = new tasks.LambdaInvoke(this, 'HandleError', {
      lambdaFunction: props.errorHandlerFunction,
      payload: sfn.TaskInput.fromObject({
        'documentId.$': '$.documentId',
        'userId.$': '$.userId',
        'error.$': '$.error',
        'errorType.$': '$.errorType',
      }),
      outputPath: '$.Payload',
    });
    
    // Connect HandleError to Fail
    const errorChain = handleErrorTask.next(failState);

    // Build the choice state
    const checkStatusChoice = new sfn.Choice(this, 'CheckStatus', {
      comment: 'Check if document processing was successful',
    })
      .when(
        sfn.Condition.stringEquals('$.status', 'completed'),
        successState
      )
      .when(
        sfn.Condition.stringEquals('$.status', 'failed'),
        errorChain
      )
      .otherwise(errorChain);

    // Define ExtractText task - Invoke BedrockProcessor Lambda
    const extractTextTask = new tasks.LambdaInvoke(this, 'ExtractText', {
      lambdaFunction: props.bedrockProcessorFunction,
      payload: sfn.TaskInput.fromObject({
        'documentId.$': '$.documentId',
        'userId.$': '$.userId',
        'vertical.$': '$.vertical',
        's3Key.$': '$.s3Key',
        'fileType.$': '$.fileType',
      }),
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
      taskTimeout: sfn.Timeout.duration(cdk.Duration.minutes(5)),
    });

    // Add retry policy to ExtractText task
    extractTextTask.addRetry(...retryPolicy);

    // Add error catching to ExtractText task
    // Route errors to HandleError chain
    extractTextTask.addCatch(errorChain, {
      errors: ['States.ALL'],
      resultPath: '$.errorInfo',
    });

    // Build the complete workflow: ExtractText → CheckStatus
    extractTextTask.next(checkStatusChoice);

    // Create the state machine
    this.stateMachine = new sfn.StateMachine(this, 'DocumentProcessingStateMachine', {
      stateMachineName: `DocumentProcessing-${props.environment}`,
      definitionBody: sfn.DefinitionBody.fromChainable(extractTextTask),
      timeout: cdk.Duration.minutes(10),
      comment: 'Orchestrates document processing workflow with Bedrock',
      tracingEnabled: true,
    });

    // Grant the state machine permission to invoke Lambda functions
    props.bedrockProcessorFunction.grantInvoke(this.stateMachine);
    props.errorHandlerFunction.grantInvoke(this.stateMachine);

    // Grant the trigger Lambda permission to start executions
    this.stateMachine.grantStartExecution(props.stepFunctionsTriggerFunction);

    // Configure S3 event notification to trigger Step Functions via Lambda
    props.documentsBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(props.stepFunctionsTriggerFunction),
      {
        prefix: 'documents/',
      }
    );

    // Add tags
    cdk.Tags.of(this.stateMachine).add('Component', 'Orchestration');
    cdk.Tags.of(this.stateMachine).add('Environment', props.environment);

    // Output state machine ARN
    new cdk.CfnOutput(cdk.Stack.of(this), 'StateMachineArn', {
      value: this.stateMachine.stateMachineArn,
      description: 'ARN of Document Processing State Machine',
      exportName: `DocumentProcessingStateMachine-${props.environment}`,
    });

    new cdk.CfnOutput(cdk.Stack.of(this), 'StateMachineName', {
      value: this.stateMachine.stateMachineName,
      description: 'Name of Document Processing State Machine',
    });
  }
}
