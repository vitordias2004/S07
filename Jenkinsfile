pipeline {
    agent any

    environment {
        // Variáveis de e-mail — NÃO hardcoded, vêm do Jenkins Credentials
        EMAIL_REMETENTE = credentials('email-remetente')
        EMAIL_DESTINO   = credentials('email-destino')
        EMAIL_SENHA     = credentials('email-senha')

        // Configurações do pipeline
        CYPRESS_BASE_URL = 'http://nginx:80'
        REPORT_DIR       = 'test-results'
        BUILD_DIR        = 'build'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Testes') {
            steps {
                script {
                    echo 'Executando testes Cypress...'
                    sh "mkdir -p ${REPORT_DIR}"
                    sh """
                        cd testes
                        npm install
                        npx cypress run \
                            --browser chrome \
                            --reporter junit \
                            --reporter-options "mochaFile=../${REPORT_DIR}/cypress-results.xml"
                    """
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: '**/test-results/*.xml'
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    echo 'Empacotando aplicação...'
                    sh "mkdir -p ${BUILD_DIR}"
                    sh """
                        tar -czvf ${BUILD_DIR}/app-build-\$(date +%Y%m%d-%H%M%S).tar.gz \
                            testes/ \
                            Dockerfile \
                            docker-compose.yml
                    """
                }
            }
        }

        stage('Notificação') {
            steps {
                script {
                    echo 'Enviando notificação por e-mail...'
                    def buildStatus = currentBuild.currentResult ?: 'UNKNOWN'
                    sh """
                        node script-email.js \
                            --from "${EMAIL_REMETENTE}" \
                            --to "${EMAIL_DESTINO}" \
                            --password "${EMAIL_SENHA}" \
                            --status "${buildStatus}" \
                            --build "${BUILD_NUMBER}"
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finalizado!'
            archiveArtifacts artifacts: '**/build/*.tar.gz',      allowEmptyArchive: true
            archiveArtifacts artifacts: '**/test-results/*.xml',  allowEmptyArchive: true
            cleanWs()
        }
        success {
            echo 'Pipeline completado com SUCESSO!'
        }
        failure {
            echo 'Pipeline FALHOU! Verifique os logs.'
        }
    }
}
