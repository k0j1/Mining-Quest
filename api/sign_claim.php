
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

// --- 設定 ---
// 署名者の秘密鍵 (Solidityの signerAddress = 0xB6eDacfc0dFc759E9AC5b9b8B6eB32310ac1Bb49 に対応するもの)
// 環境変数から安全に読み込んでください。
$signerPrivateKey = getenv('SIGNER_PRIVATE_KEY'); 

// コントラクトアドレス (リプレイ攻撃防止のためハッシュに含める)
$contractAddress = "0x193708bB0AC212E59fc44d6D6F3507F25Bc97fd4";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// リクエストボディ取得
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
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
    http_response_code(400);
    echo json_encode(['error' => 'Missing parameters']);
    exit;
}

try {
    // Note: 本番環境ではここでDBを再度参照し、
    // $fidのユーザーが本当に$questPidを完了し、$rewardが正しいか検証すべきです。

    // --- ABI Encode Packed の再現 ---
    // Solidity: keccak256(abi.encodePacked(fid, questPid, questId, questReward, reward, totalReward, address(this)))
    // uint256: 32bytes (big endian), address: 20bytes
    
    // GMP関数を使用して数値を16進数文字列に変換し、32バイト(64文字)にパディング
    function toUint256Hex($val) {
        // 文字列として扱うことで大きな数値をサポート
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

    // --- 署名生成 ---
    // 動作には `composer require kornrunner/keccak simplito/elliptic-php` が必要です。
    // 環境に合わせてオートローダーを読み込んでください。
    require_once __DIR__ . '/vendor/autoload.php';
    
    use kornrunner\Keccak;
    use Elliptic\EC;

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

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
