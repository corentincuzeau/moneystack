pipeline {
    agent any

    environment {
        GIT_COMMIT_SHORT = ''
        GIT_COMMIT_MSG = ''
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.GIT_COMMIT_MSG = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
                }
                echo "Commit: ${env.GIT_COMMIT_SHORT}"
                echo "Message: ${env.GIT_COMMIT_MSG}"
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('Build Shared Package') {
            steps {
                sh 'npm run build -w @moneystack/shared'
            }
        }

        stage('Build Docker Test Images') {
            steps {
                sh 'docker compose -f docker-compose.test.yml build'
            }
        }

        stage('Run Tests') {
            parallel {
                stage('API Tests') {
                    steps {
                        sh 'docker compose -f docker-compose.test.yml run --rm api-test'
                    }
                }
                stage('Web Tests') {
                    steps {
                        sh 'docker compose -f docker-compose.test.yml run --rm web-test'
                    }
                }
            }
        }

        stage('Publish Test Results') {
            steps {
                junit allowEmptyResults: true, testResults: '**/test-results/*.xml'
            }
        }
    }

    post {
        always {
            sh 'docker compose -f docker-compose.test.yml down -v --remove-orphans || true'
            cleanWs()
        }
        success {
            echo "Tests passed successfully for commit ${env.GIT_COMMIT_SHORT}"
        }
        failure {
            echo "Tests failed for commit ${env.GIT_COMMIT_SHORT}"
        }
    }
}
