
<?php
// api/sign_claim.php
// フロントエンドからのリクエストを受け、SolidityのclaimReward関数用の署名を生成します。

// エラー時でもCORSヘッダーを返すために最初に記述
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// OPTIONSメソッド（プリフライトリクエスト）への対応
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// デバッグ用にエラーを表示する設定に変更
ini_set('display_errors', 1); 
ini_set('log_errors', 1);
error_reporting(E_ALL);

function jsonError($message, $code = 500) {
    // 既にヘッダーが送られていない場合のみステータスコード設定
    if (!headers_sent()) {
        http_response_code($code);
    }
    // エラー詳細を返す
    echo json_encode(['error' => $message], JSON_PRETTY_PRINT);
    exit;
}

// 致命的エラー（構文エラーやrequire失敗など）をキャッチ
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE || $error['type'] === E_COMPILE_ERROR)) {
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json');
        }
        echo json_encode(['error' => 'Fatal Error: ' . $error['message'] . ' in ' . $error['file'] . ' on line ' . $error['line']]);
    }
});

// --- 1. 依存ライブラリのチェック ---
$autoloadPath = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    jsonError("Dependency Error: 'vendor/autoload.php' not found at " . $autoloadPath . ". Please check deployment and Composer install.", 500);
}
require_once $autoloadPath;

// --- 2. 拡張モジュールチェックとヘルパー関数定義 ---

// 大きな数を16進数文字列(64文字パディング)に変換する関数
function bigIntToHex($value) {
    // 値を文字列として正規化
    $value = (string)$value;

    // GMPが使える場合
    if (extension_loaded('gmp')) {
        $hex = gmp_strval(gmp_init($value), 16);
    } 
    // BCMathが使える場合 (GMPがない環境へのフォールバック)
    elseif (extension_loaded('bcmath')) {
        $hex = '';
        $current = $value;
        do {
            $mod = bcmod($current, '16');
            $hex = dechex((int)$mod) . $hex;
            $current = bcdiv($current, '16', 0);
        } while (bccomp($current, '0') > 0);
        // 0の場合
        if ($hex === '') $hex = '0';
    } 
    // どちらもない場合はエラー
    else {
        throw new Exception("Server Configuration Error: PHP extension 'gmp' or 'bcmath' is required for BigInt processing.");
    }

    if (strlen($hex) % 2 != 0) { $hex = '0' . $hex; }
    return str_pad($hex, 64, '0', STR_PAD_LEFT);
}

// --- 3. 設定チェック ---
$signerPrivateKey = getenv('SIGNER_PRIVATE_KEY'); 
if (!$signerPrivateKey) {
    // サーバーによっては $_SERVER や apache_getenv で取れる場合があるためフォールバック
    $signerPrivateKey = $_SERVER['SIGNER_PRIVATE_KEY'] ?? null;
}

if (!$signerPrivateKey) {
    jsonError("Server Configuration Error: Environment variable 'SIGNER_PRIVATE_KEY' is missing.", 500);
}

// コントラクトアドレス (リプレイ攻撃防止のためハッシュに含める)
$contractAddress = "0x193708bB0AC212E59fc44d6D6F3507F25Bc97fd4";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError("Method Not Allowed (Only POST is accepted)", 405);
}

// リクエストボディ取得
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!$input) {
    jsonError("Invalid JSON body received: " . json_last_error_msg(), 400);
}

// パラメータ取得
$fid = $input['fid'] ?? null;
$questPid = $input['questPid'] ?? null;
$questId = $input['questId'] ?? null;
$questReward = $input['questReward'] ?? null;
$reward = $input['reward'] ?? null;
$totalReward = $input['totalReward'] ?? null;

// バリデーション
if ($fid === null || $questPid === null || $questId === null || $questReward === null || $reward === null || $totalReward === null) {
    $missing = [];
    if ($fid === null) $missing[] = 'fid';
    if ($questPid === null) $missing[] = 'questPid';
    if ($questId === null) $missing[] = 'questId';
    if ($questReward === null) $missing[] = 'questReward';
    if ($reward === null) $missing[] = 'reward';
    if ($totalReward === null) $missing[] = 'totalReward';
    
    jsonError("Missing required parameters: " . implode(', ', $missing), 400);
}

try {
    use kornrunner\Keccak;
    use Elliptic\EC;

    $packedData = '';
    $packedData .= bigIntToHex($fid);
    $packedData .= bigIntToHex($questPid);
    $packedData .= bigIntToHex($questId);
    $packedData .= bigIntToHex($questReward);
    $packedData .= bigIntToHex($reward);
    $packedData .= bigIntToHex($totalReward);
    $packedData .= str_replace('0x', '', strtolower($contractAddress));

    // 1. メッセージハッシュ
    $hash = Keccak::hash(hex2bin($packedData), 256);
    
    // 2. Ethereum Signed Message Prefix
    // "\x19Ethereum Signed Message:\n32" + hash
    $msg = "\x19Ethereum Signed Message:\n32" . hex2bin($hash);
    $msgHash = Keccak::hash($msg, 256);

    // 3. 署名
    $ec = new EC('secp256k1');
    $key = $ec->keyFromPrivate($signerPrivateKey);
    $signatureObj = $key->sign($msgHash, ['canonical' => true]);
    
    $r = str_pad($signatureObj->r->toString(16), 64, '0', STR_PAD_LEFT);
    $s = str_pad($signatureObj->s->toString(16), 64, '0', STR_PAD_LEFT);
    $v = dechex($signatureObj->recoveryParam + 27);
    
    $signature = '0x' . $r . $s . $v;

    echo json_encode([
        'success' => true,
        'signature' => $signature
    ]);

} catch (Throwable $e) {
    // 例外発生時の詳細情報を返す
    jsonError("Processing Error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine(), 500);
}
?>
