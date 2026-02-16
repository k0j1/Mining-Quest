
<?php
// api/sign_claim.php
// フロントエンドからのリクエストを受け、SolidityのclaimReward関数用の署名を生成します。
// 必要なパラメータ: fid, questPid, questId, questReward, reward, totalReward
// 依存ライブラリ: kornrunner/keccak (composer require kornrunner/keccak)
//                simplito/elliptic-php (composer require simplito/elliptic-php) 

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// エラーをキャッチしてJSONで返すための設定
ini_set('display_errors', 0); // HTMLエラー出力を抑制
error_reporting(E_ALL);

function jsonError($message, $code = 500) {
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit;
}

// 致命的エラー（構文エラーやrequire失敗など）をキャッチ
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE || $error['type'] === E_COMPILE_ERROR)) {
        http_response_code(500);
        echo json_encode(['error' => 'Fatal Error: ' . $error['message']]);
    }
});

// --- 依存関係チェック ---
$autoloadPath = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    jsonError("Vendor autoload not found at $autoloadPath. Please run 'composer install' or check deployment.", 500);
}

if (!extension_loaded('gmp')) {
    // GMPがないと大きな整数の16進変換が難しい
    jsonError("PHP GMP extension is required.", 500);
}

require_once $autoloadPath;

// --- 設定 ---
$signerPrivateKey = getenv('SIGNER_PRIVATE_KEY'); 
if (!$signerPrivateKey) {
    jsonError("Server configuration error: SIGNER_PRIVATE_KEY is missing.", 500);
}

// コントラクトアドレス (リプレイ攻撃防止のためハッシュに含める)
$contractAddress = "0x193708bB0AC212E59fc44d6D6F3507F25Bc97fd4";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError("Method Not Allowed", 405);
}

// リクエストボディ取得
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    jsonError("Invalid JSON body", 400);
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
    jsonError("Missing required parameters (fid, questPid, questId, questReward, reward, totalReward)", 400);
}

try {
    use kornrunner\Keccak;
    use Elliptic\EC;

    // --- ABI Encode Packed の再現 ---
    // Solidity: keccak256(abi.encodePacked(fid, questPid, questId, questReward, reward, totalReward, address(this)))
    // uint256: 32bytes (big endian), address: 20bytes
    
    // GMP関数を使用して数値を16進数文字列に変換し、32バイト(64文字)にパディング
    function toUint256Hex($val) {
        $hex = gmp_strval(gmp_init($val), 16);
        if (strlen($hex) % 2 != 0) { $hex = '0' . $hex; }
        return str_pad($hex, 64, '0', STR_PAD_LEFT);
    }

    $packedData = '';
    $packedData .= toUint256Hex($fid);
    $packedData .= toUint256Hex($questPid);
    $packedData .= toUint256Hex($questId);
    $packedData .= toUint256Hex($questReward);
    $packedData .= toUint256Hex($reward);
    $packedData .= toUint256Hex($totalReward);
    // アドレスは '0x' を除き小文字化
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
    jsonError($e->getMessage(), 500);
}
?>
