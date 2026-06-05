pipeline {
    agent any

    environment {
        // Variáveis de e-mail — NÃO hardcoded, vêm do Jenkins Credentials
        EMAIL_REMETENTE = credentials('email-remetente')
        EMAIL_DESTINO   = credentials('email-destino')
        EMAIL_SENHA     = credentials('email-senha')

        // Credenciais do docker hub
        DOCKER_HUB_CREDS = credentials('docker-hub-credentials')
        
        // Configuracoes do docker hub
        DOCKER_IMAGE = "${DOCKER_HUB_CREDS_USR}/s07-devops"
        DOCKER_TAG = "${BUILD_NUMBER}"

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

        stage('Build Docker Image') {  
            steps {
                script {
                    echo 'Building Docker image...'
                    sh """
                        docker build -f Dockerfile -t ${DOCKER_IMAGE}:${DOCKER_TAG} .
                        docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest
                    """
                }
            }
        }

        stage('Testes') {
            steps {
                script {
                    echo 'Executando testes Cypress dentro da imagem Docker...'
                    sh "mkdir -p ${REPORT_DIR}"
                    sh """
                        docker run --rm \
                            -v \$PWD/testes:/app/testes \
                            -v \$PWD/${REPORT_DIR}:/app/${REPORT_DIR} \
                            -e CYPRESS_BASE_URL=${CYPRESS_BASE_URL} \
                            ${DOCKER_IMAGE}:${DOCKER_TAG} \
                            npx cypress run --browser electron --reporter junit --reporter-options "mochaFile=/app/${REPORT_DIR}/cypress-results.xml"
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

        stage('Push to Docker Hub') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo 'Pushing image to Docker Hub...'

                    sh """
                        echo "${DOCKER_HUB_CREDS_PSW}" | docker login -u "${DOCKER_HUB_CREDS_USR}" --password-stdin
                        docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                        docker push ${DOCKER_IMAGE}:latest
                        docker logout
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
