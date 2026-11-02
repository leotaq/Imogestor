# Entrada interativa da senha existente. Nao gravar senha em arquivo ou argumento.
# Gera exportacao logica; NAO restaura nem altera objetos do servidor de origem.
$ErrorActionPreference = 'Stop'
$projectRoot = 'E:\Novos projetos\Gestor_imob'
$binRoot = Join-Path $projectRoot '.local-tools\postgresql17\pgsql\bin'
$dumpExe = Join-Path $binRoot 'pg_dump.exe'
$restoreExe = Join-Path $binRoot 'pg_restore.exe'
$rolesExe = Join-Path $binRoot 'pg_dumpall.exe'
if (-not (Test-Path -LiteralPath $dumpExe)) { throw 'Preparar primeiro o runtime PostgreSQL 17.' }
$backupBase = Join-Path $projectRoot 'backups\supabase'
New-Item -ItemType Directory -Force -Path $backupBase | Out-Null
$stamp = [DateTimeOffset]::UtcNow.ToString('yyyyMMddTHHmmssZ')
$outputFolder = Join-Path $backupBase ($stamp + '-' + [guid]::NewGuid().ToString('N').Substring(0,8))
New-Item -ItemType Directory -Path $outputFolder | Out-Null
$archivePath = Join-Path $outputFolder 'database.dump'
$manifestPath = Join-Path $outputFolder 'manifest.json'
$manifest = [ordered]@{
  project_ref='pfakuvnuyixebvtmwmgu'; project_name='novabase'; started_utc=[DateTimeOffset]::UtcNow.ToString('o');
  source_host='aws-1-sa-east-1.pooler.supabase.com'; source_port=5432;
  destination=$outputFolder; status='pending'; database_dump_verified=$false; restore_tested=$false;
  storage_files_included=$false; role_passwords_included=$false; files=@();
  note='Exportacao logica do banco; nao inclui arquivos de Storage, configuracao do projeto, Edge Functions ou senhas de papeis.'
}
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding utf8

function Invoke-PgTool {
  param([string]$Exe,[string[]]$ToolArgs,[string]$Password,[string]$LogName)
  $start = [Diagnostics.ProcessStartInfo]::new()
  $start.FileName = $Exe
  $start.UseShellExecute = $false
  $start.CreateNoWindow = $true
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  foreach($argument in $ToolArgs){$start.ArgumentList.Add($argument)}
  # Credencial existe somente no ambiente desse processo filho.
  $start.Environment['PGPASSWORD'] = $Password
  $start.Environment['PGHOST'] = 'aws-1-sa-east-1.pooler.supabase.com'
  $start.Environment['PGPORT'] = '5432'
  $start.Environment['PGUSER'] = 'postgres.pfakuvnuyixebvtmwmgu'
  $start.Environment['PGDATABASE'] = 'postgres'
  $start.Environment['PGSSLMODE'] = 'require'
  $start.Environment['PGCONNECT_TIMEOUT'] = '20'
  $start.Environment['PGOPTIONS'] = '-c default_transaction_read_only=on -c lock_timeout=5000 -c statement_timeout=300000'
  # Evitar uso acidental de arquivo de senha global.
  $start.Environment['PGPASSFILE'] = Join-Path $outputFolder 'nao-utilizar-pgpass'
  $process = [Diagnostics.Process]::new()
  $process.StartInfo = $start
  try {
    [void]$process.Start()
    $stdoutTask=$process.StandardOutput.ReadToEndAsync()
    $stderrTask=$process.StandardError.ReadToEndAsync()
    if(-not $process.WaitForExit(600000)) { $process.Kill($true); throw 'Tempo limite da ferramenta de backup.' }
    $stdout=$stdoutTask.GetAwaiter().GetResult()
    $stderr=$stderrTask.GetAwaiter().GetResult()
    # Arquivos de log recebem diagnosticos, nunca valores de linhas do banco.
    [IO.File]::WriteAllText((Join-Path $outputFolder $LogName),$stderr)
    return [pscustomobject]@{ExitCode=$process.ExitCode;Stdout=$stdout;Stderr=$stderr}
  } finally {
    [void]$start.Environment.Remove('PGPASSWORD')
    $process.Dispose()
  }
}

$secureInput=$null
$passwordPtr=[IntPtr]::Zero
$plainPassword=$null
try {
  Write-Host 'Backup local do projeto novabase. A senha nao sera exibida nem salva.'
  Write-Host 'Informe a senha do BANCO PostgreSQL, nao uma chave da API.'
  $secureInput=Read-Host -Prompt 'Senha existente do banco' -AsSecureString
  if($secureInput.Length -eq 0){throw 'Senha vazia: backup nao iniciado.'}
  $passwordPtr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureInput)
  $plainPassword=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPtr)
  Write-Host 'Gerando exportacao consistente, somente por leitura...'
  $dumpResult=Invoke-PgTool -Exe $dumpExe -ToolArgs @('--format=custom','--lock-wait-timeout=5000','--no-password',('--file='+$archivePath)) -Password $plainPassword -LogName 'pg_dump.stderr.log'
  if($dumpResult.ExitCode -ne 0){throw ('pg_dump falhou. Conferir pg_dump.stderr.log em '+$outputFolder)}
  if((Get-Item -LiteralPath $archivePath).Length -le 0){throw 'Arquivo de backup vazio.'}
  # Listagem local: nenhuma conexao de restauracao e aberta.
  $tocOutput=& $restoreExe --list $archivePath 2>&1
  if($LASTEXITCODE -ne 0){throw 'pg_restore nao conseguiu ler o indice do arquivo.'}
  $tocOutput | Set-Content -LiteralPath (Join-Path $outputFolder 'archive-toc.txt') -Encoding utf8
  $manifest.database_dump_verified=$true
  $roleResult=Invoke-PgTool -Exe $rolesExe -ToolArgs @('--roles-only','--no-role-passwords','--no-password') -Password $plainPassword -LogName 'pg_dumpall.stderr.log'
  if($roleResult.ExitCode -eq 0){
    [IO.File]::WriteAllText((Join-Path $outputFolder 'roles-sem-senhas.sql'),$roleResult.Stdout)
    $manifest.status='dump-created-awaiting-restore'
  } else {
    $manifest.status='dump-created-role-export-failed'
  }
  foreach($name in @('database.dump','roles-sem-senhas.sql','archive-toc.txt')){
    $file=Join-Path $outputFolder $name
    if(Test-Path -LiteralPath $file){
      $manifest.files+=@{name=$name;bytes=(Get-Item -LiteralPath $file).Length;sha256=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash}
    }
  }
  Write-Host ('Exportacao salva em: '+$outputFolder)
  Write-Host 'Ainda falta testar a restauracao em ambiente separado. Nenhuma restauracao foi executada.'
} catch {
  $manifest.status='failed'
  $manifest['error']=$_.Exception.Message
  Write-Host ('Backup nao concluido: '+$_.Exception.Message) -ForegroundColor Red
} finally {
  $plainPassword=$null
  if($passwordPtr -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPtr)}
  if($secureInput){$secureInput.Dispose()}
  $manifest['finished_utc']=[DateTimeOffset]::UtcNow.ToString('o')
  $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding utf8
  Write-Host 'Pode fechar esta janela e avisar no chat.'
  [void](Read-Host 'Pressione Enter para fechar')
}
