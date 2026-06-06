pipeline {
    agent any

    environment {
        // Variaveis de e-mail: nao hardcoded, vem do Jenkins Credentials
        EMAIL_REMETENTE = credentials('email-remetente')
        EMAIL_DESTINO   = credentials('email-destino')
        EMAIL_SENHA     = credentials('email-senha')

        // Credenciais do Docker Hub
        DOCKER_HUB_CREDS = credentials('docker-hub-credentials')

        // Configuracoes do Docker Hub
        DOCKER_IMAGE = "${DOCKER_HUB_CREDS_USR}/s07-devops"
        DOCKER_TAG = "${BUILD_NUMBER}"

        // Configuracoes do pipeline
        REPORT_DIR         = 'test-results'
        BUILD_DIR          = 'build'
        EMAIL_HISTORY_FILE = '/shared/nginx-data/email-history.json'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Email Dependencies') {
            steps {
                script {
                    echo 'Instalando dependencias do script de e-mail...'
                    sh 'npm install --omit=dev'
                }
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
                    echo 'Executando os specs Cypress de testes/cypress/e2e dentro da imagem Docker...'
                    sh "rm -rf ${REPORT_DIR} && mkdir -p ${REPORT_DIR}"
                    sh """
                        container_name="s07-cypress-${BUILD_NUMBER}"

                        docker rm -f "\$container_name" >/dev/null 2>&1 || true
                        docker create --name "\$container_name" \
                            ${DOCKER_IMAGE}:${DOCKER_TAG} \
                            cypress run --spec "cypress/e2e/**/*.cy.js" --browser electron --reporter junit --reporter-options "mochaFile=/e2e/${REPORT_DIR}/cypress-results-[hash].xml" >/dev/null

                        test_exit_code=0
                        docker start -a "\$container_name" || test_exit_code=\$?
                        docker cp "\$container_name:/e2e/${REPORT_DIR}/." "${REPORT_DIR}/" >/dev/null 2>&1 || true
                        docker rm -f "\$container_name" >/dev/null 2>&1 || true

                        exit "\$test_exit_code"
                    """
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: "${REPORT_DIR}/**/*.xml"
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    echo 'Empacotando aplicacao...'
                    sh "mkdir -p ${BUILD_DIR}"
                    sh """
                        tar -czvf ${BUILD_DIR}/app-build-\$(date +%Y%m%d-%H%M%S).tar.gz \
                            --exclude='./.git' \
                            --exclude='./node_modules' \
                            --exclude='./testes/node_modules' \
                            --exclude='./app/node_modules' \
                            --exclude='./${BUILD_DIR}' \
                            --exclude='./${REPORT_DIR}' \
                            .
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
    }

    post {
        always {
            echo 'Pipeline finalizado!'
            script {
                echo 'Enviando notificacao por e-mail...'
                sh '''
                    if [ ! -d node_modules/nodemailer ]; then
                        npm install --omit=dev
                    fi
                '''
                def buildStatus = currentBuild.currentResult ?: 'UNKNOWN'
                def buildUrl = env.BUILD_URL ?: ''
                sh 'mkdir -p /shared/nginx-data'
                def emailExitCode = withEnv([
                    "BUILD_STATUS=${buildStatus}",
                    "BUILD_URL=${buildUrl}",
                    "EMAIL_HISTORY_FILE=${EMAIL_HISTORY_FILE}"
                ]) {
                    sh(
                        script: '''
                            node script-email.js
                        ''',
                        returnStatus: true
                    )
                }

                if (emailExitCode != 0) {
                    echo 'Aviso: falha ao enviar a notificacao por e-mail. A pipeline seguira com o resultado principal da build.'
                }
            }
            archiveArtifacts artifacts: '**/build/*.tar.gz',     allowEmptyArchive: true
            archiveArtifacts artifacts: "${REPORT_DIR}/**/*.xml", allowEmptyArchive: true
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
