
<?php
// api/sign_claim.php
// フロントエンドからのリクエストを受け、SolidityのclaimReward関数用の署名を生成します。

// 出力バッファリング開始 (予期せぬ出力をキャプチャし、JSON破壊を防ぐ)
ob_start();

// ヘッダー設定 (エラー時も返すため最初に行う)
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// エラー表示設定 (JSONレスポンスのためHTML出力は抑制)
ini_set('display_errors', 0); 
ini_set('log_errors', 1);
error_reporting(E_ALL);

// シャットダウン関数: Fatal Error発生時もJSONを返す
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE || $error['type'] === E_COMPILE_ERROR)) {
        // バッファをクリアしてクリーンな状態にする
        if (ob_get_length()) ob_clean();
        
        if (!headers_sent()) {
            http_response_code(500);
        }
        
        echo json_encode([
            'error' => 'Fatal Error: ' . $error['message'],
            'file' => $error['file'],
            'line' => $error['line']
        ]);
    }
});

try {
    // OPTIONSメソッド（プリフライトリクエスト）への対応
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        ob_end_clean();
        exit(0);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Method Not Allowed (Only POST is accepted)", 405);
    }

    // --- 1. 依存ライブラリの読み込み ---
    $autoloadPath = __DIR__ . '/vendor/autoload.php';
    if (!file_exists($autoloadPath)) {
        throw new Exception("Dependency Error: 'vendor/autoload.php' not found at " . $autoloadPath);
    }
    require_once $autoloadPath;

    // --- 1.5 環境変数の読み込み (.env対応) ---
    
    // Dotenvライブラリがある場合は利用
    if (class_exists('Dotenv\Dotenv')) {
        try {
            // カレントディレクトリと親ディレクトリを探索
            $dotenv = Dotenv\Dotenv::createImmutable([__DIR__, __DIR__ . '/..']);
            $dotenv->safeLoad();
        } catch (Exception $e) {
            // エラーは無視して続行
        }
    }

    // .envの手動フォールバック読み込み関数
    if (!function_exists('manualLoadEnv')) {
        function manualLoadEnv($path) {
            if (!file_exists($path)) return;
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || strpos($line, '#') === 0) continue;
                $parts = explode('=', $line, 2);
                if (count($parts) !== 2) continue;
                $name = trim($parts[0]);
                $value = trim($parts[1]);
                // クォート削除
                if (preg_match('/^"(.*)"$/', $value, $m)) $value = $m[1];
                elseif (preg_match("/^'(.*)'$/", $value, $m)) $value = $m[1];
                
                // 環境変数が未設定の場合のみセット
                if (getenv($name) === false) {
                    putenv("$name=$value");
                    $_ENV[$name] = $value;
                    $_SERVER[$name] = $value;
                }
            }
        }
    }

    // 手動読み込み実行 (カレントディレクトリと親ディレクトリ)
    manualLoadEnv(__DIR__ . '/.env');
    manualLoadEnv(__DIR__ . '/../.env');


    // --- 2. 拡張モジュールチェックとヘルパー関数 ---
    function bigIntToHex($value) {
        $value = (string)$value;
        if (extension_loaded('gmp')) {
            $hex = gmp_strval(gmp_init($value), 16);
        } elseif (extension_loaded('bcmath')) {
            $hex = '';
            $current = $value;
            do {
                $mod = bcmod($current, '16');
                $hex = dechex((int)$mod) . $hex;
                $current = bcdiv($current, '16', 0);
            } while (bccomp($current, '0') > 0);
            if ($hex === '') $hex = '0';
        } else {
            throw new Exception("Server Configuration Error: PHP extension 'gmp' or 'bcmath' is required.");
        }
        if (strlen($hex) % 2 != 0) { $hex = '0' . $hex; }
        return str_pad($hex, 64, '0', STR_PAD_LEFT);
    }

    // --- 3. 設定チェック ---
    // getenv, $_SERVER, $_ENV の順で確認
    $signerPrivateKey = getenv('SIGNER_PRIVATE_KEY'); 
    if (!$signerPrivateKey) $signerPrivateKey = $_SERVER['SIGNER_PRIVATE_KEY'] ?? null;
    if (!$signerPrivateKey) $signerPrivateKey = $_ENV['SIGNER_PRIVATE_KEY'] ?? null;

    if (!$signerPrivateKey) {
        throw new Exception("Server Configuration Error: Environment variable 'SIGNER_PRIVATE_KEY' is missing.");
    }

    // コントラクトアドレス
    $contractAddress = "0x193708bB0AC212E59fc44d6D6F3507F25Bc97fd4";

    // --- 4. リクエストボディ取得と検証 ---
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (!$input) {
        throw new Exception("Invalid JSON body received: " . json_last_error_msg());
    }

    // パラメータ取得
    $fid = $input['fid'] ?? null;
    $questPid = $input['questPid'] ?? null;
    $questId = $input['questId'] ?? null;
    $questReward = $input['questReward'] ?? null;
    $reward = $input['reward'] ?? null;
    $totalReward = $input['totalReward'] ?? null;

    if ($fid === null || $questPid === null || $questId === null || $questReward === null || $reward === null || $totalReward === null) {
        $missing = [];
        if ($fid === null) $missing[] = 'fid';
        if ($questPid === null) $missing[] = 'questPid';
        if ($questId === null) $missing[] = 'questId';
        if ($questReward === null) $missing[] = 'questReward';
        if ($reward === null) $missing[] = 'reward';
        if ($totalReward === null) $missing[] = 'totalReward';
        
        throw new Exception("Missing required parameters: " . implode(', ', $missing));
    }

    // --- 5. 署名生成処理 ---
    
    // kornrunner\Keccak や Elliptic\EC が存在するか確認
    if (!class_exists('kornrunner\Keccak') || !class_exists('Elliptic\EC')) {
        throw new Exception("Libraries not loaded correctly. Check composer install.");
    }

    $packedData = '';
    $packedData .= bigIntToHex($fid);
    $packedData .= bigIntToHex($questPid);
    $packedData .= bigIntToHex($questId);
    $packedData .= bigIntToHex($questReward);
    $packedData .= bigIntToHex($reward);
    $packedData .= bigIntToHex($totalReward);
    $packedData .= str_replace('0x', '', strtolower($contractAddress));

    // メッセージハッシュ
    $hash = kornrunner\Keccak::hash(hex2bin($packedData), 256);
    
    // Ethereum Signed Message Prefix
    $msg = "\x19Ethereum Signed Message:\n32" . hex2bin($hash);
    $msgHash = kornrunner\Keccak::hash($msg, 256);

    // 署名
    $ec = new Elliptic\EC('secp256k1');
    $key = $ec->keyFromPrivate($signerPrivateKey);
    $signatureObj = $key->sign($msgHash, ['canonical' => true]);
    
    $r = str_pad($signatureObj->r->toString(16), 64, '0', STR_PAD_LEFT);
    $s = str_pad($signatureObj->s->toString(16), 64, '0', STR_PAD_LEFT);
    $v = dechex($signatureObj->recoveryParam + 27);
    
    $signature = '0x' . $r . $s . $v;

    // バッファにあった内容を破棄（Warningなど）し、クリーンなJSONを出力
    ob_end_clean();

    echo json_encode([
        'success' => true,
        'signature' => $signature
    ]);

} catch (Throwable $e) {
    // 例外発生時
    // バッファをクリアしてJSONのみ返す
    if (ob_get_length()) ob_clean();
    
    // コードが405などの場合はそれを維持、それ以外（一般的なエラー）は500
    $code = $e->getCode();
    if ($code < 100 || $code > 599) $code = 500;
    
    if (!headers_sent()) {
        http_response_code($code);
    }

    echo json_encode([
        'error' => $e->getMessage(),
        'file' => basename($e->getFile()), // セキュリティのためファイル名のみ
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString() // デバッグ用（本番では消すべきだが調査のため表示）
    ], JSON_PRETTY_PRINT);
}
?>
